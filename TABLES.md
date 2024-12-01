### rivals2-elobot-users Table:

discordid PK, string (the user's discordid) steamid64 string (the user's
corresponding steamid64) guildid_to_nickname Record<string, string> (a mapping
of the user's guild id's they are in with the bot to their nicknames) optout
boolean (if present + true, this user will be skipped when appending ranked
information to nicknames)

### rivals2-elobot-userstats Table:

steamid64 PK, string (the user's corresponding steamid64) timestamp SORT KEY,
number (the timestamp this record was taken at, Epoch UNIX time) elo number (the
user's ELO at the time) rank number (the user's rank at the time) winstreak
string (the user's winstreak, marked +n, -n, or 0)
