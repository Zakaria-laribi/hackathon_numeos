import { StateGraph, START, END } from "@langchain/langgraph";
import { KenzaState } from "./state.js";
import { ingestNode } from "./nodes/ingest.js";
import { extractNode } from "./nodes/extract.js";
import { routeDecision } from "./nodes/route.js";
import {
  catalogNode,
  cartNode,
  discountNode,
  policyNode,
  escalateNode,
} from "./nodes/stubs.js";

/**
 * Graphe : START → ingest → extract → ROUTE (conditionnel) →
 * [catalog|cart|discount|policy|escalate] → END.
 * guard / explainer / persist seront ajoutés ensuite, entre le routage
 * et END, sans toucher à ce qui existe.
 */
export const graph = new StateGraph(KenzaState)
  .addNode("ingest", ingestNode)
  .addNode("extract", extractNode)
  .addNode("catalog", catalogNode)
  .addNode("cart_agent", cartNode)
  .addNode("discount", discountNode)
  .addNode("policy", policyNode)
  .addNode("escalate", escalateNode)
  .addEdge(START, "ingest")
  .addEdge("ingest", "extract")
  .addConditionalEdges("extract", routeDecision, {
    catalog: "catalog",
    cart_agent: "cart_agent",
    discount: "discount",
    policy: "policy",
    escalate: "escalate",
  })
  .addEdge("catalog", END)
  .addEdge("cart_agent", END)
  .addEdge("discount", END)
  .addEdge("policy", END)
  .addEdge("escalate", END);

export const kenzaGraph = graph.compile();