import {
  BatchWriteItemCommand,
  DeleteItemCommand,
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
  ScanCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import type { interfaces } from "@scope/shared";

export function getDB(): DynamoDBClient {
  const AWS_ACCESS_KEY_ID = Deno.env.get("AWS_ACCESS_KEY_ID");
  const AWS_SECRET_KEY_ID = Deno.env.get("AWS_SECRET_KEY_ID");
  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_KEY_ID) {
    throw new Error(
      "getDB(): Couldn't find .env credentials for Dynamo instance!",
    );
  }
  const db = new DynamoDBClient({
    region: "us-east-2",
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_KEY_ID,
    },
  });
  return db;
}

export async function addUser(
  discordid: string,
  steamId64: string,
  guildid: string,
  nickname: string,
) {
  if (!guildid) {
    console.error("Received null guildid:", guildid);
    return;
  }
  const db = getDB();

  const params = {
    TableName: "rivals2-elobot-users",
    Item: {
      discordid: { S: discordid },
      steamid64: { S: steamId64 },
      guildid_to_nickname: { M: { [guildid]: { S: nickname } } },
    },
  };

  try {
    const command = new PutItemCommand(params);
    await db.send(command);
    console.log(`addUser(): User with nickname ${nickname} added successfully`);
  } catch (error) {
    console.error("Error adding user:", error);
  }
}

export async function addUserStatsEntries(
  userStatsData: interfaces.UserStats[],
) {
  try {
    const db = getDB();
    if (userStatsData.length == 0) {
      console.error(
        "addUserStatsEntries(): received empty userStatsData. Returning!",
      );
      return;
    }
    const userStatsInsert = userStatsData
      .map((userStats) => ({
        PutRequest: {
          Item: {
            steamid64: { S: userStats.steamid64 },
            elo: { N: userStats.elo.toString() },
            rank: { N: userStats.rank.toString() },
            timestamp: { N: userStats.timestamp.toString() },
            winstreak: { S: userStats.winstreak || "0" },
          },
        },
      }));

    const params = {
      RequestItems: {
        "rivals2-elobot-userstats": userStatsInsert,
      },
    };

    const command = new BatchWriteItemCommand(params);
    const _data = await db.send(command);
  } catch (error) {
    console.error("Error adding user stats:", error);
  }
}

export async function getUsers(): Promise<interfaces.User[]> {
  try {
    const db = getDB();
    const params = {
      TableName: "rivals2-elobot-users",
    };

    const command = new ScanCommand(params);
    const data = await db.send(command);
    if (!data.Items) {
      return [];
    }
    const users: interfaces.User[] = data.Items.map((item) =>
      unmarshall(item) as interfaces.User
    );

    return users;
  } catch (error) {
    console.error("Error getting users:", error);
    return [];
  }
}

export async function getUser(
  discordid: string,
): Promise<interfaces.User | undefined> {
  const db = getDB();
  const params = {
    TableName: "rivals2-elobot-users",
    KeyConditionExpression: "discordid = :discordid",
    ExpressionAttributeValues: {
      ":discordid": { S: discordid },
    },
    Limit: 1,
  };

  // const timestampParams = {
  //     TableName: "rivals2-elobot-userstats",
  //     KeyConditionExpression: "steamid64 = :steamid",
  //     ExpressionAttributeValues: {
  //         ":steamid": { S: "76561198069969259" }
  //     },
  //     ScanIndexForward: false, // descending order of timestamps
  //     Limit: 1,
  // };
  try {
    const command = new QueryCommand(params);
    const data = await db.send(command);
    if (!data.Items) {
      throw new Error(`Couldn't find user with discordid ${discordid} in db!`);
    }
    const user = unmarshall(data.Items[0]) as interfaces.User;
    return user;
  } catch (error) {
    console.error(error);
    return;
  }
}

async function getLatestTimestamp(): Promise<string | undefined> {
  const db = getDB();

  const timestampParams = {
    TableName: "rivals2-elobot-userstats",
    KeyConditionExpression: "steamid64 = :steamid",
    ExpressionAttributeValues: {
      ":steamid": { S: "76561198069969259" },
    },
    ScanIndexForward: false, // descending order of timestamps
    Limit: 1,
  };

  const command = new QueryCommand(timestampParams);
  const timestampData = await db.send(command);
  const latestTimestamp = timestampData.Items?.[0]?.timestamp.N;
  if (!latestTimestamp) {
    return;
  }
  return latestTimestamp;
}

export async function getLatestUsersStats(): Promise<
  interfaces.UserStats[] | undefined
> {
  const db = getDB();

  try {
    const latestTimestamp = await getLatestTimestamp();
    const latestUsersStats: interfaces.UserStats[] = [];

    if (!latestTimestamp) {
      return;
    }

    const latestParams = {
      TableName: "rivals2-elobot-userstats",
      FilterExpression: "#ts = :timestamp",
      ExpressionAttributeNames: {
        "#ts": "timestamp", // avoiding reserved keyword
      },
      ExpressionAttributeValues: {
        ":timestamp": { N: latestTimestamp },
      },
    };

    let ExclusiveStartKey = undefined;
    do {
      const scanCommand: ScanCommand = new ScanCommand({
        ...latestParams,
        ExclusiveStartKey,
      });
      const scanData = await db.send(scanCommand);
      if (!scanData.Items) {
        return;
      }
      latestUsersStats.push(
        ...scanData.Items.map((item) =>
          unmarshall(item) as interfaces.UserStats
        ),
      );

      ExclusiveStartKey = scanData.LastEvaluatedKey;
    } while (ExclusiveStartKey);

    return latestUsersStats;
  } catch (error) {
    console.error("Error getting user stats:", error);
    return;
  }
}

export async function getLatestUserStats(
  steamid64: string,
): Promise<interfaces.UserStats | undefined> {
  const db = getDB();

  try {
    const latestTimestamp = await getLatestTimestamp();

    if (!latestTimestamp) {
      return;
    }

    const params = {
      TableName: "rivals2-elobot-userstats",
      KeyConditionExpression: "steamid64 = :steamid AND #ts = :timestamp",
      ExpressionAttributeNames: {
        "#ts": "timestamp", // avoiding reserved keyword
      },
      ExpressionAttributeValues: {
        ":steamid": { S: steamid64 },
        ":timestamp": { N: latestTimestamp },
      },
      Limit: 1,
    };

    const command = new QueryCommand(params);
    const data = await db.send(command);
    if (!data.Items || data.Items.length === 0) {
      return;
    }

    const latestUserStats = unmarshall(data.Items[0]) as interfaces.UserStats;
    return latestUserStats;
  } catch (error) {
    console.error("Error getting user stats:", error);
    return;
  }
}

export async function updateNickname(
  discordid: string,
  guildid: string,
  nickname: string,
) {
  const db = getDB();
  const params = {
    TableName: "rivals2-elobot-users",
    Key: {
      discordid: { S: discordid },
    },
    UpdateExpression: "SET guildid_to_nickname.#guildid = :nickname",
    ExpressionAttributeNames: {
      "#guildid": guildid,
    },
    ExpressionAttributeValues: {
      ":nickname": { S: nickname },
    },
  };

  try {
    const command = new UpdateItemCommand(params);
    await db.send(command);
  } catch (error) {
    console.error("Error updating nickname:", error);
    throw error;
  }
}

export async function updateOptout(discordid: string, optout: boolean) {
  const db = getDB();
  const params = {
    TableName: "rivals2-elobot-users",
    Key: {
      discordid: { S: discordid },
    },
    UpdateExpression: "SET #optout = :optout",
    ExpressionAttributeNames: {
      "#optout": "optout",
    },
    ExpressionAttributeValues: {
      ":optout": { BOOL: optout },
    },
  };

  try {
    const command = new UpdateItemCommand(params);
    await db.send(command);
  } catch (error) {
    console.error("Error updating optout:", error);
    throw error;
  }
}

export async function deleteUser(discordid: string) {
  const db = getDB();
  const params = {
    TableName: "rivals2-elobot-users",
    Key: {
      discordid: { S: discordid },
    },
  };

  try {
    const command = new DeleteItemCommand(params);
    await db.send(command);
  } catch (error) {
    console.error("deleteUser() error: ", error);
  }
}
