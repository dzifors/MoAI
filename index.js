import {
    Client,
    EmbedBuilder,
    Events,
    GatewayIntentBits,
    REST,
    Routes
} from "discord.js";
import { configDotenv } from "dotenv";
import { askOpenAi, buildPrompt } from "./utils/openai.js";

configDotenv();
export const PERSONALITY_PROMPT = buildPrompt();

const OWNER_IDS = process.env.OWNER_IDS.split(" ");

const commands = [
    {
        name: "askmoai",
        description: "Replies with Pong!",
        options: [
            {
                type: 3,
                name: "content",
                description: "message content",
                required: true
            }
        ]
    },
    {
        name: "currentprompt",
        description:
            "Shows the current personality prompt (will work only for certain people)"
    }
];

const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);

try {
    console.log("Refresing slash commands");

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
        body: commands
    });

    console.log("Successfully refreshed slash commands");
} catch (error) {
    console.error(error.rawError.errors["0"]["options"]["0"]);
}

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.on(Events.ClientReady, (readyClient) => {
    console.log(`Logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "askmoai") {
        const username = interaction.user.username;
        const messageContent = interaction.options.getString("content");

        const response = await askOpenAi(username, messageContent);

        await interaction.reply(response);
    }

    if (interaction.commandName === "currentprompt") {
        if (!OWNER_IDS.includes(interaction.user.id)) {
            return await interaction.reply(
                "Nie masz uprawnień do wykonania tej komendy."
            );
        }

        const embed = new EmbedBuilder().setTitle("Aktualny prompt Moaia");

        embed.addFields({
            name: "100% szansy",
            value: PERSONALITY_PROMPT.guaranteed
        });

        for (let chanceElement of PERSONALITY_PROMPT.chance) {
            embed.addFields({
                name: `${chanceElement.percentChance * 100}% szansy`,
                value: chanceElement.element
            });
        }

        embed.addFields({
            name: `${process.env.ANEURYSM_CHANCE * 100}% szansy`,
            value: "Podniesienie temperatury prompta do `2` (normalnie jest `1.15`)"
        });

        embed.addFields({
            name: `${process.env.ROAST_CHANCE * 100}% szansy`,
            value: "Wysłanie poniższego GIFa:"
        });

        embed.setImage(process.env.ROAST_GIF);

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
});

client.login(process.env.BOT_TOKEN);
