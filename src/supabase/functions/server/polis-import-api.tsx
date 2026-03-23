import { Hono } from "npm:hono";
import {
  parsePolisStatements,
  parsePolisVotes,
  assemblePolisData,
  importAllData,
} from "./polis-utils.tsx";
import { recalculateClustersForRoom } from "./clustering.tsx";
import { validateDeveloper } from "./internal-utils.ts";

const app = new Hono();

app.post("/make-server-f1a393b4/import-polis",
  validateDeveloper,
  async (c) => {
    try {
      const {
        debateName,
        subHeard,
        statementsCSV,
        votesCSV,
        importerId,
        dryRun,
      } = await c.req.json();

      if (
        !debateName ||
        !subHeard ||
        !statementsCSV ||
        !votesCSV ||
        !importerId ||
        typeof dryRun !== "boolean"
      ) {
        return c.json({ error: "Missing required fields" }, 400);
      }

      console.log(
        `Starting Polis import${dryRun ? " (dry run)" : ""}:`,
        {
          debateName,
          subHeard,
          importerId,
        },
      );

      const polisStatements = parsePolisStatements(statementsCSV);
      const polisVotes = parsePolisVotes(
        votesCSV,
        polisStatements.length,
      );

      if (polisStatements.length === 0) {
        return c.json(
          { error: "Statements CSV is empty or invalid" },
          400,
        );
      }

      if (polisVotes.length === 0) {
        return c.json(
          { error: "Votes CSV is empty or invalid" },
          400,
        );
      }

      console.log(
        `Parsed ${polisStatements.length} statements and ${polisVotes.length} vote rows`,
      );

      const data = assemblePolisData(
        debateName,
        subHeard,
        importerId,
        polisStatements,
        polisVotes,
      );

      if (dryRun) {
        const sampleUsers = data.users.slice(0, 3).map((u) => ({
          nickname: u.nickname,
          email: u.email,
          isTestUser: u.isTestUser,
        }));

        const sampleStatements = data.statements
          .slice(0, 5)
          .map((s) => ({
            text: s.text,
            author: s.author,
            agrees: s.agrees,
            disagrees: s.disagrees,
            passes: s.passes,
          }));

        const voteDistribution = {
          agree: data.votes.filter((v) => v.voteType === "agree")
            .length,
          disagree: data.votes.filter(
            (v) => v.voteType === "disagree",
          ).length,
          pass: data.votes.filter((v) => v.voteType === "pass")
            .length,
        };

        const warnings = [];

        if (data.users.length > 100) {
          warnings.push(
            `Large number of users: ${data.users.length}`,
          );
        }

        if (data.statements.length > 500) {
          warnings.push(
            `Large number of statements: ${data.statements.length}`,
          );
        }

        if (data.votes.length > 10000) {
          warnings.push(
            `Large number of votes: ${data.votes.length}`,
          );
        }

        if (data.truncateFlags.statements) {
          warnings.push(
            `Statements truncated to 1000 (original: ${polisStatements.length})`,
          );
        }

        if (data.truncateFlags.votes) {
          warnings.push(
            `Votes truncated to 1000 (original: ${polisVotes.length})`,
          );
        }

        if (data.truncateFlags.users) {
          warnings.push(`Users truncated to 1000`);
        }

        const avgVotesPerStatement =
          data.votes.length / data.statements.length;
        if (avgVotesPerStatement < 2) {
          warnings.push(
            `Low average votes per statement: ${avgVotesPerStatement.toFixed(1)}`,
          );
        }

        return c.json({
          success: true,
          dryRun: true,
          summary: {
            debateName,
            subHeard,
            userCount: data.users.length,
            statementCount: data.statements.length,
            voteCount: data.votes.length,
            avgVotesPerStatement: avgVotesPerStatement.toFixed(1),
          },
          room: {
            topic: data.room.topic,
            phase: data.room.phase,
            mode: data.room.mode,
            participantCount: data.room.participants.length,
          },
          voteDistribution,
          samples: {
            users: sampleUsers,
            statements: sampleStatements,
          },
          warnings,
        });
      } else {
        await importAllData(data);
        await recalculateClustersForRoom(data.room.id);
      }

      return c.json({
        success: true,
        roomId: data.room.id,
        userCount: data.userIdMap.size,
        statementCount: data.statements.length,
        voteCount: data.votes.length,
      });
    } catch (error) {
      console.error("Error importing Polis data:", error);
      return c.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to import Polis data",
        },
        500,
      );
    }
  }
);

export { app as polisImportApi };