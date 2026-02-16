import { Statement } from "./types";

export function getTestDatabase() {
    return [
        {
            convoTopic: "Is a one month free apartment deal a legitimate offer or a potential trap?",
            statements: [
                {
                    id: "stmt0",
                    text: "One month free may seem enticing, but it often comes with hidden fees or rent increases later on.",
                    superAgrees: 0,
                    agrees: 0,
                    disagrees: 0,
                    passes: 0,
                } as Statement,
                {
                    id: "stmt1",
                    text: "Many landlords use these promotions to fill vacancies quickly, so they can be legitimate if you do your research.",
                    superAgrees: 0,
                    agrees: 0,
                    disagrees: 0,
                    passes: 0,
                } as Statement,
                {
                    id: "stmt2",
                    text: "Such deals usually signal that the property may have issues that aren't immediately apparent, so caution is warranted.",
                    superAgrees: 0,
                    agrees: 0,
                    disagrees: 0,
                    passes: 0,
                } as Statement,
            ],
        },
    ];
}