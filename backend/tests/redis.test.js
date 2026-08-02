import connection from "../queues/connection.js";

try {
    await connection.ping();
    console.log("PING successful");
} catch (error) {
    console.error(error);
} finally {
    connection.disconnect();
}