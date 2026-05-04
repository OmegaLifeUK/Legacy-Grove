import { supabase } from "./supabaseClient";

// ─── MAPPERS ────────────────────────────────────────────────────────────────

function treeToDb(tree) {
  return {
    species: tree.species,
    h2o: Math.round(tree.h2o),
    light: Math.round(tree.light),
    soil: Math.round(tree.soil),
    bio: Math.round(tree.bio),
    clean: Math.round(tree.clean),
    mood: Math.round(tree.mood || 70),
    mulched: tree.mulched,
    staked: tree.staked,
    has_birdhouse: tree.hasBirdhouse,
    infested: tree.infested,
    fungal: tree.fungal,
    current_event: tree.currentEvent,
    day: tree.day,
    rings: tree.rings,
    ring_history: tree.ringHistory || [],
    clean_count: tree.cleanCount || 0,
    feed_count: tree.feedCount || 0,
    water_wise_days: tree.waterWiseDays || 0,
    eco_shields_held: tree.ecoShieldsHeld || 0,
    eco_shield_expiry: tree.ecoShieldExpiry ? new Date(tree.ecoShieldExpiry).toISOString() : null,
    missions_for_shield: tree.missionsForShield || 0,
    last_visit_at: new Date().toISOString(),
    event_started_at: tree.eventStartedAt ? new Date(tree.eventStartedAt).toISOString() : null,
    last_ring_day: tree.lastRingDay || 0,
  };
}

function dbToTree(row, chain) {
  return {
    h2o: row.h2o,
    light: row.light,
    soil: row.soil,
    bio: row.bio,
    clean: row.clean,
    mood: row.mood,
    mulched: row.mulched,
    staked: row.staked,
    hasBirdhouse: row.has_birdhouse,
    infested: row.infested,
    fungal: row.fungal,
    currentEvent: row.current_event,
    day: row.day,
    rings: row.rings,
    ringHistory: row.ring_history || [],
    species: row.species,
    assignedAt: row.assigned_at ? new Date(row.assigned_at).getTime() : new Date(row.created_at).getTime(),
    cleanCount: row.clean_count,
    feedCount: row.feed_count,
    waterWiseDays: row.water_wise_days,
    ecoShieldsHeld: row.eco_shields_held,
    ecoShieldExpiry: row.eco_shield_expiry ? new Date(row.eco_shield_expiry).getTime() : null,
    missionsForShield: row.missions_for_shield,
    eventStartedAt: row.event_started_at ? new Date(row.event_started_at).getTime() : null,
    lastRingDay: row.last_ring_day || 0,
    lastActionTimes: {},
    chain: chain || [],
  };
}

// ─── SPECIES (duplicated from App.jsx for drift calc) ──────────────────────
const SPECIES_TOLERANCES = {
  apple: { waterTol: 1 }, rowan: { waterTol: 0.9 }, hazel: { waterTol: 1 },
  fieldmaple: { waterTol: 0.9 }, holly: { waterTol: 0.9 }, silverbirch: { waterTol: 0.8 },
  hornbeam: { waterTol: 1 }, crabapple: { waterTol: 1 }, amelanchier: { waterTol: 0.9 },
  lombardy: { waterTol: 1.2 },
};

function applyCatchUpDrift(tree, species, hoursAway) {
  const sp = SPECIES_TOLERANCES[species] || SPECIES_TOLERANCES.apple;
  const h = Math.min(Math.max(hoursAway, 0), 48);
  return {
    ...tree,
    h2o: Math.max(0, tree.h2o - (2 * h * (1 / sp.waterTol))),
    soil: Math.max(0, tree.soil - (0.5 * h)),
    bio: Math.max(0, tree.bio - (0.3 * h)),
    clean: Math.max(0, tree.clean - (1 * h)),
    mood: Math.max(0, (tree.mood || 70) - (0.5 * h)),
  };
}

// ─── SCHOOLS ────────────────────────────────────────────────────────────────

export async function getSchoolByCode(code) {
  const { data, error } = await supabase
    .from("schools")
    .select()
    .eq("code", code.toUpperCase().trim())
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getDefaultSchool() {
  const { data, error } = await supabase
    .from("schools")
    .select()
    .limit(1)
    .single();
  if (error) throw error;
  return data;
}

// ─── AUTH ────────────────────────────────────────────────────────────────────

export async function authenticateKid(schoolCode, username, password) {
  const school = await getSchoolByCode(schoolCode);
  if (!school) return null;

  const { data: kid, error } = await supabase
    .from("kids")
    .select("id, school_id, name, username, password_hash, assigned_tree_id, is_active, created_at, last_login, privacy_accepted_at")
    .eq("school_id", school.id)
    .eq("username", username.toLowerCase().trim())
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  if (!kid) return null;

  const { data: valid, error: rpcError } = await supabase
    .rpc("verify_password", { raw_password: password, hashed: kid.password_hash });
  if (rpcError) throw rpcError;
  if (!valid) return null;

  await supabase
    .from("kids")
    .update({ last_login: new Date().toISOString() })
    .eq("id", kid.id);

  const { password_hash: _, ...safeKid } = kid;
  return { kid: safeKid, school };
}

export async function authenticateKidByUsername(username, password) {
  const { data: kid, error } = await supabase
    .from("kids")
    .select("id, school_id, name, username, password_hash, assigned_tree_id, is_active, created_at, last_login, privacy_accepted_at, schools(*)")
    .eq("username", username.toLowerCase().trim())
    .maybeSingle();
  if (error) throw error;
  if (!kid) return null;
  if (!kid.is_active) return { inactive: true };

  const { data: valid, error: rpcError } = await supabase
    .rpc("verify_password", { raw_password: password, hashed: kid.password_hash });
  if (rpcError) throw rpcError;
  if (!valid) return null;

  await supabase
    .from("kids")
    .update({ last_login: new Date().toISOString() })
    .eq("id", kid.id);

  const { password_hash: _, schools: kidSchool, ...safeKid } = kid;
  return { kid: safeKid, school: kidSchool };
}

export async function authenticateAdmin(email, password) {
  const { data: admin, error } = await supabase
    .from("admins")
    .select("id, school_id, email, display_name, role, is_active, created_at, password_hash, schools(*)")
    .eq("email", email.toLowerCase().trim())
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  if (!admin) return null;

  const { data: valid, error: rpcError } = await supabase
    .rpc("verify_password", { raw_password: password, hashed: admin.password_hash });
  if (rpcError) throw rpcError;
  if (!valid) return null;

  const { password_hash: _, ...safeAdmin } = admin;
  return safeAdmin;
}

export async function getKidBySchoolAndUsername(schoolId, username) {
  const { data, error } = await supabase
    .from("kids")
    .select("id, is_active")
    .eq("school_id", schoolId)
    .eq("username", username.toLowerCase().trim())
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ─── KIDS ───────────────────────────────────────────────────────────────────

export async function createKid(schoolId, name, username, password) {
  const { data: hashedPw, error: hashError } = await supabase
    .rpc("hash_password", { raw_password: password });
  if (hashError) throw hashError;

  const { data, error } = await supabase
    .from("kids")
    .insert({
      school_id: schoolId,
      name,
      username: username.toLowerCase().trim(),
      password_hash: hashedPw,
    })
    .select("id, school_id, name, username, is_active, created_at, privacy_accepted_at")
    .single();
  if (error) throw error;
  return data;
}

export async function getKid(id) {
  const { data, error } = await supabase
    .from("kids")
    .select("id, school_id, name, username, assigned_tree_id, is_active, created_at, last_login, privacy_accepted_at")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

// ─── TREES ──────────────────────────────────────────────────────────────────

export async function createTreeForSchool(schoolId, species) {
  const { data, error } = await supabase
    .from("trees")
    .insert({
      school_id: schoolId,
      species,
      status: "available",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getTree(treeId) {
  const { data, error } = await supabase
    .from("trees")
    .select()
    .eq("id", treeId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateTree(treeId, treeState) {
  const { error } = await supabase
    .from("trees")
    .update(treeToDb(treeState))
    .eq("id", treeId);
  if (error) throw error;
}

export async function markTreeDead(treeId) {
  const { error } = await supabase
    .from("trees")
    .update({ status: "dead", current_kid_id: null })
    .eq("id", treeId);
  if (error) throw error;
}

// ─── CARE SESSIONS ──────────────────────────────────────────────────────────

export async function createCareSession(treeId, kidId, startDay) {
  const { data, error } = await supabase
    .from("care_sessions")
    .insert({
      tree_id: treeId,
      kid_id: kidId,
      start_day: startDay || 1,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getActiveSession(kidId) {
  const { data, error } = await supabase
    .from("care_sessions")
    .select("*, trees(*)")
    .eq("kid_id", kidId)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function hasCompletedSession(kidId) {
  const { count, error } = await supabase
    .from("care_sessions")
    .select("id", { count: "exact", head: true })
    .eq("kid_id", kidId)
    .eq("status", "completed");
  if (error) throw error;
  return count > 0;
}

export async function endCareSession(sessionId, badges, completedMissions) {
  const { error } = await supabase
    .from("care_sessions")
    .update({
      status: "completed",
      badges_earned: badges || [],
      completed_missions: completedMissions || [],
      ended_at: new Date().toISOString(),
    })
    .eq("id", sessionId);
  if (error) throw error;
}

// ─── CARE CHAIN ─────────────────────────────────────────────────────────────

export async function getCareChain(treeId) {
  const { data, error } = await supabase
    .from("care_chain")
    .select()
    .eq("tree_id", treeId)
    .order("order_index", { ascending: true });
  if (error) throw error;
  return (data || []).map((c) => ({
    name: c.name,
    note: c.message,
    emoji: "🌿",
    timestamp: new Date(c.created_at).getTime(),
  }));
}

export async function addToCareChain(treeId, kidId, sessionId, name, message) {
  const { count } = await supabase
    .from("care_chain")
    .select("*", { count: "exact", head: true })
    .eq("tree_id", treeId);

  const { error } = await supabase
    .from("care_chain")
    .insert({
      tree_id: treeId,
      kid_id: kidId,
      care_session_id: sessionId,
      name,
      message,
      order_index: count || 0,
    });
  if (error) throw error;
}

// ─── ACTION LOG ─────────────────────────────────────────────────────────────

export async function logAction(sessionId, actionKey, day, statChanges) {
  const { error } = await supabase
    .from("action_log")
    .insert({
      care_session_id: sessionId,
      action_key: actionKey,
      day,
      stat_changes: statChanges || null,
    });
  if (error) throw error;
}

// ─── COMPOSITE OPERATIONS ───────────────────────────────────────────────────

export async function startNewTree(species, kidId, schoolId) {
  const treeRow = await createTreeForSchool(schoolId, species);

  const assignedAt = new Date().toISOString();
  const { error: treeErr } = await supabase
    .from("trees")
    .update({
      current_kid_id: kidId,
      status: "assigned",
      assigned_at: assignedAt,
    })
    .eq("id", treeRow.id);
  if (treeErr) throw treeErr;

  treeRow.assigned_at = assignedAt;

  await supabase
    .from("kids")
    .update({ assigned_tree_id: treeRow.id })
    .eq("id", kidId);

  const session = await createCareSession(treeRow.id, kidId, 1);
  const tree = dbToTree(treeRow, []);
  return { tree, treeId: treeRow.id, sessionId: session.id };
}

export async function assignRandomTree(kidId, schoolId) {
  const { data: available, error } = await supabase
    .from("trees")
    .select()
    .eq("school_id", schoolId)
    .eq("status", "available")
    .order("updated_at", { ascending: true });
  if (error) throw error;
  if (!available || available.length === 0) return null;

  const treeRow = available[Math.floor(Math.random() * available.length)];

  const assignedAt = new Date().toISOString();
  const { error: treeErr } = await supabase
    .from("trees")
    .update({
      current_kid_id: kidId,
      status: "assigned",
      assigned_at: assignedAt,
    })
    .eq("id", treeRow.id);
  if (treeErr) throw treeErr;

  treeRow.assigned_at = assignedAt;

  await supabase
    .from("kids")
    .update({ assigned_tree_id: treeRow.id })
    .eq("id", kidId);

  const session = await createCareSession(treeRow.id, kidId, treeRow.day);
  const chain = await getCareChain(treeRow.id);
  const tree = dbToTree(treeRow, chain);
  return { tree, treeId: treeRow.id, sessionId: session.id, species: treeRow.species };
}

export async function receiveExistingTree(kidId, schoolId) {
  return assignRandomTree(kidId, schoolId);
}

export async function passOnTree(treeId, sessionId, kidId, treeState, name, message, badges, completedMissions) {
  await updateTree(treeId, treeState);
  await addToCareChain(treeId, kidId, sessionId, name, message);
  await endCareSession(sessionId, badges, completedMissions);

  const { error: treeErr } = await supabase
    .from("trees")
    .update({ current_kid_id: null, status: "available", assigned_at: null })
    .eq("id", treeId);
  if (treeErr) throw treeErr;

  await supabase
    .from("kids")
    .update({ assigned_tree_id: null })
    .eq("id", kidId);
}

export async function loadSession(kidId) {
  const session = await getActiveSession(kidId);
  if (!session || !session.trees) return null;

  const chain = await getCareChain(session.tree_id);
  let tree = dbToTree(session.trees, chain);
  const species = session.trees.species;

  // Apply catch-up drift based on time since last DB update
  const updatedAt = session.trees.updated_at ? new Date(session.trees.updated_at).getTime() : Date.now();
  const hoursAway = Math.max(0, (Date.now() - updatedAt) / 3600000);
  if (hoursAway > 0 && !isNaN(hoursAway)) {
    tree = applyCatchUpDrift(tree, species, hoursAway);
  }

  // Clear expired events
  if (tree.eventStartedAt && Date.now() - tree.eventStartedAt > 3 * 3600000) {
    tree.currentEvent = null;
    tree.eventStartedAt = null;
  }

  // Backfill missed ring days
  const now = Date.now();
  const assignedAt = tree.assignedAt;
  const currentDay = Math.floor((now - assignedAt) / 86400000) + 1;
  let lastRingDay = tree.lastRingDay || 0;
  const ringHistory = [...(tree.ringHistory || [])];

  while (lastRingDay < currentDay - 1) {
    lastRingDay++;
    ringHistory.push("green");
  }
  tree.ringHistory = ringHistory;
  tree.lastRingDay = lastRingDay;

  // Update day to match timestamp-based calculation
  tree.day = currentDay;

  // Save drifted state and last_visit_at back to DB
  try {
    await updateTree(session.tree_id, tree);
  } catch (e) {
    // Non-fatal — continue with local drifted state
  }

  return {
    tree,
    treeId: session.tree_id,
    sessionId: session.id,
    species,
    badges: session.badges_earned || [],
    completedMissions: session.completed_missions || [],
  };
}

export async function saveProgress(treeId, sessionId, treeState, badges, completedMissions) {
  await updateTree(treeId, treeState);
  const { error } = await supabase
    .from("care_sessions")
    .update({
      badges_earned: badges || [],
      completed_missions: completedMissions || [],
    })
    .eq("id", sessionId);
  if (error) throw error;
}

// ─── ADMIN FUNCTIONS ───────────────────────────────────────────────────────

export async function getAdmin(adminId) {
  const { data, error } = await supabase
    .from("admins")
    .select("id, school_id, email, display_name, role, is_active, created_at, schools(*)")
    .eq("id", adminId)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listKids(schoolId) {
  const { data, error } = await supabase
    .from("kids")
    .select("id, name, username, is_active, created_at, last_login, privacy_accepted_at, assigned_tree_id, trees:assigned_tree_id(species)")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function updateKid(kidId, updates) {
  const clean = {};
  if (updates.name !== undefined) clean.name = updates.name.trim();
  if (updates.username !== undefined) clean.username = updates.username.toLowerCase().trim();
  const { error } = await supabase
    .from("kids")
    .update(clean)
    .eq("id", kidId);
  if (error) throw error;
}

export async function resetKidPassword(kidId, newPassword) {
  const { data: hashedPw, error: hashError } = await supabase
    .rpc("hash_password", { raw_password: newPassword });
  if (hashError) throw hashError;
  const { error } = await supabase
    .from("kids")
    .update({ password_hash: hashedPw })
    .eq("id", kidId);
  if (error) throw error;
}

export async function toggleKidActive(kidId, isActive) {
  const { error } = await supabase
    .from("kids")
    .update({ is_active: isActive })
    .eq("id", kidId);
  if (error) throw error;
}

export async function deleteKid(kidId) {
  const { data: kid } = await supabase
    .from("kids")
    .select("assigned_tree_id")
    .eq("id", kidId)
    .maybeSingle();

  if (kid?.assigned_tree_id) {
    await supabase
      .from("trees")
      .update({ current_kid_id: null, status: "available", assigned_at: null })
      .eq("id", kid.assigned_tree_id);
  }

  await supabase
    .from("care_sessions")
    .update({ status: "completed", ended_at: new Date().toISOString() })
    .eq("kid_id", kidId)
    .eq("status", "active");

  const { error } = await supabase
    .from("kids")
    .delete()
    .eq("id", kidId);
  if (error) throw error;
}

export async function listTrees(schoolId) {
  const { data, error } = await supabase
    .from("trees")
    .select("*, keeper:current_kid_id(name, username)")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getTreeDetails(treeId) {
  const { data: tree, error } = await supabase
    .from("trees")
    .select("*, keeper:current_kid_id(name, username)")
    .eq("id", treeId)
    .single();
  if (error) throw error;

  const chain = await getCareChain(treeId);

  const { data: sessions } = await supabase
    .from("care_sessions")
    .select("*, kid:kid_id(name, username)")
    .eq("tree_id", treeId)
    .order("started_at", { ascending: true });

  return { tree, chain, sessions: sessions || [] };
}

export async function deleteTree(treeId) {
  const { data: tree } = await supabase
    .from("trees")
    .select("current_kid_id")
    .eq("id", treeId)
    .maybeSingle();

  if (tree?.current_kid_id) {
    await supabase
      .from("kids")
      .update({ assigned_tree_id: null })
      .eq("id", tree.current_kid_id);

    await supabase
      .from("care_sessions")
      .update({ status: "completed", ended_at: new Date().toISOString() })
      .eq("tree_id", treeId)
      .eq("status", "active");
  }

  const { error } = await supabase
    .from("trees")
    .delete()
    .eq("id", treeId);
  if (error) throw error;
}

export async function getSchoolStats(schoolId) {
  const { count: totalKids } = await supabase
    .from("kids")
    .select("*", { count: "exact", head: true })
    .eq("school_id", schoolId)
    .eq("is_active", true);

  const { count: totalTrees } = await supabase
    .from("trees")
    .select("*", { count: "exact", head: true })
    .eq("school_id", schoolId);

  const { count: treesInCare } = await supabase
    .from("trees")
    .select("*", { count: "exact", head: true })
    .eq("school_id", schoolId)
    .eq("status", "assigned");

  const { count: treesAvailable } = await supabase
    .from("trees")
    .select("*", { count: "exact", head: true })
    .eq("school_id", schoolId)
    .eq("status", "available");

  const { count: chainEntries } = await supabase
    .from("care_chain")
    .select("*, trees!inner(school_id)", { count: "exact", head: true })
    .eq("trees.school_id", schoolId);

  return {
    totalKids: totalKids || 0,
    totalTrees: totalTrees || 0,
    treesInCare: treesInCare || 0,
    treesAvailable: treesAvailable || 0,
    chainEntries: chainEntries || 0,
  };
}

export async function getRecentActivity(schoolId, limit = 10) {
  const { data, error } = await supabase
    .from("action_log")
    .select("*, care_sessions!inner(kid_id, tree_id, kids:kid_id(name), trees:tree_id(species))")
    .order("performed_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data || []).filter(a => a.care_sessions);
}

// ─── GDPR / PRIVACY ───────────────────────────────────────────────────────

export async function acceptPrivacy(kidId) {
  const { error } = await supabase
    .from("kids")
    .update({ privacy_accepted_at: new Date().toISOString() })
    .eq("id", kidId);
  if (error) throw error;
}

export async function exportKidData(kidId) {
  const { data: kid } = await supabase
    .from("kids")
    .select("id, name, username, created_at, last_login, privacy_accepted_at")
    .eq("id", kidId)
    .single();

  const { data: sessions } = await supabase
    .from("care_sessions")
    .select("id, tree_id, start_day, status, badges_earned, completed_missions, started_at, ended_at")
    .eq("kid_id", kidId)
    .order("started_at", { ascending: true });

  const { data: chainMessages } = await supabase
    .from("care_chain")
    .select("id, tree_id, name, message, order_index, created_at")
    .eq("kid_id", kidId)
    .order("created_at", { ascending: true });

  const sessionIds = (sessions || []).map(s => s.id);
  let actionLog = [];
  if (sessionIds.length > 0) {
    const { data } = await supabase
      .from("action_log")
      .select("id, action_key, day, stat_changes, performed_at")
      .in("care_session_id", sessionIds)
      .order("performed_at", { ascending: true });
    actionLog = data || [];
  }

  return {
    export_date: new Date().toISOString(),
    kid: kid || {},
    care_sessions: sessions || [],
    care_chain_messages: chainMessages || [],
    action_log: actionLog,
  };
}

export async function getKidDataCounts(kidId) {
  const { count: sessionCount } = await supabase
    .from("care_sessions")
    .select("*", { count: "exact", head: true })
    .eq("kid_id", kidId);

  const { count: chainCount } = await supabase
    .from("care_chain")
    .select("*", { count: "exact", head: true })
    .eq("kid_id", kidId);

  const { data: sessions } = await supabase
    .from("care_sessions")
    .select("id")
    .eq("kid_id", kidId);
  const sessionIds = (sessions || []).map(s => s.id);

  let actionCount = 0;
  if (sessionIds.length > 0) {
    const { count } = await supabase
      .from("action_log")
      .select("*", { count: "exact", head: true })
      .in("care_session_id", sessionIds);
    actionCount = count || 0;
  }

  return {
    sessions: sessionCount || 0,
    chainMessages: chainCount || 0,
    actions: actionCount || 0,
  };
}

export async function deleteKidDataFull(kidId) {
  const { data: kid } = await supabase
    .from("kids")
    .select("id, assigned_tree_id")
    .eq("id", kidId)
    .single();
  if (!kid) throw new Error("Kid not found");

  const { data: sessions } = await supabase
    .from("care_sessions")
    .select("id")
    .eq("kid_id", kidId);
  const sessionIds = (sessions || []).map(s => s.id);

  if (sessionIds.length > 0) {
    await supabase
      .from("action_log")
      .delete()
      .in("care_session_id", sessionIds);
  }

  await supabase
    .from("care_chain")
    .update({ name: "A former keeper", kid_id: null })
    .eq("kid_id", kidId);

  await supabase
    .from("care_sessions")
    .delete()
    .eq("kid_id", kidId);

  if (kid.assigned_tree_id) {
    await supabase
      .from("trees")
      .update({ current_kid_id: null, status: "available", assigned_at: null })
      .eq("id", kid.assigned_tree_id);
  }

  // Clear any trees that reference this kid
  await supabase
    .from("trees")
    .update({ current_kid_id: null, status: "available", assigned_at: null })
    .eq("current_kid_id", kidId);

  const { error } = await supabase
    .from("kids")
    .delete()
    .eq("id", kidId);
  if (error) throw error;
}

export async function getInactiveKids(schoolId, daysInactive = 365) {
  const cutoff = new Date(Date.now() - daysInactive * 86400000).toISOString();
  const { data, error } = await supabase
    .from("kids")
    .select("id, name, username, last_login, created_at")
    .eq("school_id", schoolId)
    .eq("is_active", true)
    .order("last_login", { ascending: true, nullsFirst: true });
  if (error) throw error;
  return (data || []).filter(kid => {
    const ref = kid.last_login || kid.created_at;
    return new Date(ref) < new Date(cutoff);
  });
}
