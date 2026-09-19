import { StateGraph, START, END } from "@langchain/langgraph";
import { KenzaState } from "./state.js";
import { ingestNode } from "./nodes/ingest.js";
import { extractNode } from "./nodes/extract.js";
import { routeDecision } from "./nodes/route.js";
import { catalogNode } from "./nodes/catalog.js";
import { discountNode } from "./nodes/discount.js";
import { policyNode } from "./nodes/policy.js";
import { cartNode } from "./nodes/cart.js";
import { memoryLoadNode } from "./nodes/memoryLoad.js";
import { escalateNode } from "./nodes/stubs.js";import { guardNode } from "./nodes/guard.js";
import { explainerNode } from "./nodes/explainer.js";
import { persistNode } from "./nodes/persist.js";

/**
 * Graphe complet (squelette) :
 * START → ingest → extract → ROUTE → [5 branches] → guard → explainer → persist → END
 * memory_load sera inséré entre ingest et extract à l'Étape G.
 */
export const graph = new StateGraph(KenzaState)
  .addNode("ingest", ingestNode)
  .addNode("extract", extractNode)
  .addNode("catalog", catalogNode)
  .addNode("cart_agent", cartNode)
  .addNode("discount", discountNode)
  .addNode("policy", policyNode)
  .addNode("escalate", escalateNode)
  .addNode("guard", guardNode)
  .addNode("memory_load", memoryLoadNode)
  .addNode("explainer", explainerNode)
  .addNode("persist", persistNode)
  .addEdge(START, "ingest")
  .addEdge("ingest", "extract")
.addEdge("extract", "memory_load")
.addConditionalEdges("memory_load", routeDecision, {
    catalog: "catalog",
    cart_agent: "cart_agent",
    discount: "discount",
    policy: "policy",
    escalate: "escalate",
  })
  .addEdge("catalog", "guard")
  .addEdge("cart_agent", "guard")
  .addEdge("discount", "guard")
  .addEdge("policy", "guard")
  .addEdge("escalate", "guard")
  .addEdge("guard", "explainer")
  .addEdge("explainer", "persist")
  .addEdge("persist", END);

export const kenzaGraph = graph.compile();