import { readFileSync } from "node:fs";
import { exit } from "node:process";
import { PERSONALITY_PROMPT } from "../index.js";
import axios, { AxiosError } from "axios";

/**
 * Sends a request to the OpenAI servers
 *
 * @param {string} message
 * @param {string} author
 *
 * @returns {string}
 */
export async function askOpenAi(author, message) {
    const chanceForRoast = Math.random();

    if (chanceForRoast < process.env.ROAST_CHANCE) {
        return "https://media.discordapp.net/attachments/919335494473621564/1048364890366160916/caption.gif";
    }

    const chanceForAneurysm = Math.random();

    const temperature =
        chanceForAneurysm < process.env.ANEURYSM_CHANCE ? 2 : 1.15;

    let personalityPrompt = PERSONALITY_PROMPT.guaranteed;

    for (let chanceElement of PERSONALITY_PROMPT.chance) {
        const chanceForAddition = Math.random();

        if (chanceForAddition < chanceElement.percentChance) {
            personalityPrompt += ` ${chanceElement.element}`;
        }
    }

    const requestBody = {
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: `
                # Osobowość AI:
                ${personalityPrompt}

                Osoba z którą rozmawiasz ma na imię ${author}
                `
            },
            {
                role: "user",
                content: message
            }
        ],
        temperature: temperature
    };

    const requestHeaders = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    };

    try {
        const apiResponse = await axios.post(
            process.env.OPENAI_API_URL,
            requestBody,
            {
                headers: requestHeaders
            }
        );

        const completion =
            apiResponse.data.choices[0].message.content.replaceAll("*", "#");

        return completion;
    } catch (error) {
        /**
         * @type {AxiosError}
         */
        const axiosError = error;

        return `OpenAI Error: ${JSON.stringify(axiosError.response.data.error)}`;
    }
}

export function buildPrompt() {
    try {
        const data = readFileSync("prompt.txt").toString().split("\n");

        const processedPrompt = processPromptFile(data);

        console.log(processedPrompt);

        return processedPrompt;
    } catch (err) {
        console.error(err);
        exit(1);
    }
}

/**
 * Builds the personality prompt, given the array of elements in the prompt file.
 *
 * @param {string[]} data
 */
function processPromptFile(data) {
    let guaranteedPrompt = "";
    let chancePrompt = [];

    for (let promptElement of data) {
        const workingElement = promptElement.split(" | ");

        if (workingElement[1] === "100") {
            guaranteedPrompt += ` ${workingElement[0]}`;
        } else {
            chancePrompt.push({
                element: workingElement[0],
                percentChance: parseInt(workingElement[1]) / 100
            });
        }
    }

    guaranteedPrompt = guaranteedPrompt.trim();

    return {
        guaranteed: guaranteedPrompt,
        chance: chancePrompt
    };
}
