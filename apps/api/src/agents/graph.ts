import { StateGraph, START, END } from "@langchain/langgraph";
import { KenzaState } from "./state.js";
import { ingestNode } from "./nodes/ingest.js";
import { extractNode } from "./nodes/extract.js";

/**
 * Squelette du graphe. Pour l'instant : START → ingest → extract → END.
 * Les nœuds route / catalog / cart / discount / policy / escalate / guard /
 * explainer / persist seront ajoutés ensuite, sans toucher à ce qui existe.
 */
export const graph = new StateGraph(KenzaState)
  .addNode("ingest", ingestNode)
  .addNode("extract", extractNode)
  .addEdge(START, "ingest")
  .addEdge("ingest", "extract")
  .addEdge("extract", END);

export const kenzaGraph = graph.compile();