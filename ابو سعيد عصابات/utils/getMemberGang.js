const config = require("../config.json");

module.exports = (member) => {
  for (const [gang, roleId] of Object.entries(config.gangRoles)) {
    if (member.roles.cache.has(roleId)) return gang;
  }
  return null;
};