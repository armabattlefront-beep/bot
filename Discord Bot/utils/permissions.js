const { STAFF_ROLE_IDS } = require("../config");

function isStaff(member) {
    if (!member) return false;

    // Administrator override
    if (member.permissions.has("Administrator")) return true;

    // Role-based staff check
    return member.roles.cache.some(role =>
        STAFF_ROLE_IDS.includes(role.id)
    );
}

module.exports = { isStaff };
