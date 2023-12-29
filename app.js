const express = require("express");
const app = express();
app.use(express.json());
module.exports = app;

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializationDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("The server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};

initializationDBAndServer();

const conversionToCamelCase = (player) => {
  return {
    playerId: player.player_id,
    playerName: player.player_name,
  };
};

app.get("/players/", async (request, response) => {
  //   const getPlayerQuery = `
  //           SELECT * FROM player_details;
  //       `;

  //   const players = await db.all(getPlayerQuery);
  //   response.send(players.map((eachPlayer) => conversionToCamelCase(eachPlayer)));
  const getPlayersQuery = `
          SELECT player_id as playerId,
              player_name as playerName
          FROM player_details;
      `;
  const players = await db.all(getPlayersQuery);
  response.send(players);
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
        SELECT * FROM player_details WHERE player_id = ${playerId};
    `;
  const player = await db.get(getPlayerQuery);
  response.send({
    playerId: player.player_id,
    playerName: player.player_name,
  });
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const putQuery = `
        UPDATE player_details SET player_name = '${playerName}' 
        WHERE player_id = ${playerId};
    `;

  await db.run(putQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchesQuery = `
        SELECT * FROM match_details WHERE match_id = ${matchId};
    `;
  const match = await db.get(getMatchesQuery);
  response.send({
    matchId: match.match_id,
    match: match.match,
    year: match.year,
  });
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `
        SELECT match_details.match_id as matchId ,
            match_details.match ,
            match_details.year 
        FROM match_details LEFT JOIN player_match_score ON 
            match_details.match_id = player_match_score.match_id
        WHERE player_id = ${playerId};
    `;

  const playerMatchesDetails = await db.all(getPlayerMatchesQuery);
  response.send(playerMatchesDetails);
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerQuery = `
        SELECT
            player_details.player_id as playerId ,
            player_details.player_name as playerName
        FROM player_details LEFT JOIN player_match_score ON 
            player_details.player_id = player_match_score.player_id 
        WHERE player_match_score.match_id = ${matchId};
    `;

  const playerDetails = await db.all(getPlayerQuery);
  response.send(playerDetails);
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScoreQuery = `
        SELECT
            player_details.player_id as playerId ,
            player_details.player_name as playerName ,
            SUM(player_match_score.score) as totalScore ,
            SUM(player_match_score.fours) as totalFours ,
            SUM(player_match_score.sixes) as totalSixes
        FROM player_details LEFT JOIN player_match_score ON 
            player_details.player_id = player_match_score.player_id 
        WHERE player_details.player_id = ${playerId};
    `;

  const playerScoreDetails = await db.get(getPlayerScoreQuery);
  response.send(playerScoreDetails);
});
