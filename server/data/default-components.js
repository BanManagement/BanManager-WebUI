module.exports = [
  { component: 'HTML', meta: { html: '' } },
  { component: 'ServerNameHeader', meta: { serverId: null, as: 'h2' } },
  { component: 'RecentServerPunishments', meta: { serverId: null, type: 'bans' } }
].map(c => ({ w: 16, x: 0, y: 0, ...c }))
