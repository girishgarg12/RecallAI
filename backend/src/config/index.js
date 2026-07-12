import dotenv from "dotenv";

dotenv.config();

const rawPort = process.env.PORT;
let port = 3000;

if (rawPort !== undefined) {
    port = Number(rawPort);

    if (Number.isNaN(port)) {
        throw new Error("Invalid configuration: PORT must be a number.");
    }

    if (!Number.isInteger(port)) {
        throw new Error("Invalid configuration: PORT must be an integer.");
    }

    if (port < 0 || port > 65535) {
        throw new Error(
            "Invalid configuration: PORT must be between 0 and 65535."
        );
    }
}

const config = {
    port,
};

export default config;