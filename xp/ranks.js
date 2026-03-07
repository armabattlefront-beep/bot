const ranks = [
  { level:1, name:"Recruit" },
  { level:5, name:"Private" },
  { level:10, name:"Lance Corporal" },
  { level:15, name:"Corporal" },
  { level:20, name:"Sergeant" },
  { level:30, name:"Staff Sergeant" },
  { level:40, name:"Warrant Officer" },
  { level:50, name:"Lieutenant" },
  { level:65, name:"Captain" },
  { level:80, name:"Major" },
  { level:100, name:"Colonel" },
  { level:130, name:"Brigadier" },
  { level:160, name:"General" },
  { level:200, name:"Field Marshal" }
];

function getRankName(level) {

  let current = ranks[0].name;

  for (const rank of ranks) {
    if (level >= rank.level) current = rank.name;
  }

  return `${current} • Level ${level}`;
}

module.exports = { getRankName };