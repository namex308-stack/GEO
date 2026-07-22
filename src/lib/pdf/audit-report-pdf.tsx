import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { AuditData, ScoreBreakdown, Recommendation } from "@/lib/types";

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10 },
  header: { marginBottom: 20, borderBottom: "2px solid #FF6600", paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: "bold", color: "#FF6600" },
  subtitle: { fontSize: 11, color: "#666", marginTop: 4 },
  scoreSection: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  scoreCard: { width: "22%", padding: 10, borderRadius: 6, border: "1px solid #ddd", textAlign: "center" },
  scoreBig: { fontSize: 28, fontWeight: "bold", color: "#FF6600" },
  scoreLabel: { fontSize: 9, color: "#666", marginTop: 2 },
  pillarRow: { flexDirection: "row", marginBottom: 8, padding: 8, borderRadius: 4, backgroundColor: "#f9f9f9" },
  pillarName: { width: "20%", fontWeight: "bold", fontSize: 10 },
  pillarScore: { width: "15%", textAlign: "right", fontWeight: "bold", fontSize: 12 },
  pillarSummary: { width: "65%", fontSize: 9, color: "#444", paddingLeft: 8 },
  sectionTitle: { fontSize: 14, fontWeight: "bold", marginTop: 16, marginBottom: 8, color: "#333" },
  recCard: { marginBottom: 6, padding: 8, borderRadius: 4, border: "1px solid #eee" },
  recPillar: { fontSize: 8, color: "#666", fontWeight: "bold", textTransform: "uppercase" },
  recProblem: { fontSize: 9, color: "#c0392b", marginTop: 3 },
  recSolution: { fontSize: 9, color: "#27ae60", marginTop: 2 },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, fontSize: 8, color: "#999", textAlign: "center", borderTop: "1px solid #eee", paddingTop: 8 },
});

export function AuditReportPDF({ audit }: { audit: AuditData }) {
  const breakdown = audit.breakdown ?? [];
  const recommendations = audit.recommendations ?? [];
  const categories = (audit.engineResults as { categories?: { category: string; score: number; label?: string }[] } | undefined)?.categories ?? [];
  const explainItems =
    (audit.engineResults as { explainability?: { items?: { ruleLabel: string; pointsLost: number }[] } } | undefined)?.explainability?.items ?? [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>convaudit Audit Report</Text>
          <Text style={styles.subtitle}>{audit.productName} — {audit.productUrl}</Text>
          <Text style={styles.subtitle}>Generated {new Date(audit.createdAt).toLocaleDateString()}</Text>
        </View>

        {/* Overall score */}
        <View style={styles.scoreSection}>
          <View style={[styles.scoreCard, { borderColor: "#FF6600", width: "30%" }]}>
            <Text style={styles.scoreBig}>{audit.overallScore}</Text>
            <Text style={styles.scoreLabel}>Overall Score</Text>
          </View>
          {audit.competitorScore != null && (
            <View style={[styles.scoreCard, { width: "30%" }]}>
              <Text style={[styles.scoreBig, { color: "#999" }]}>{audit.competitorScore}</Text>
              <Text style={styles.scoreLabel}>Competitor Score</Text>
            </View>
          )}
        </View>

        {/* Pillar scores */}
        <Text style={styles.sectionTitle}>Score Breakdown</Text>
        {breakdown.map((b: ScoreBreakdown) => (
          <View key={b.pillar} style={styles.pillarRow}>
            <Text style={styles.pillarName}>{b.label}</Text>
            <Text style={styles.pillarScore}>{b.score}</Text>
            <Text style={styles.pillarSummary}>{b.summary}</Text>
          </View>
        ))}

        {/* Recommendations */}
        <Text style={styles.sectionTitle}>Recommendations ({recommendations.length})</Text>
        {recommendations.slice(0, 8).map((r: Recommendation) => (
          <View key={r.id} style={styles.recCard}>
            <Text style={styles.recPillar}>{r.pillar} — {r.severity} ({r.impact} impact)</Text>
            <Text style={styles.recProblem}>Problem: {r.problem}</Text>
            <Text style={styles.recSolution}>Solution: {r.solution}</Text>
          </View>
        ))}

        {categories.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Category Scores</Text>
            {categories.slice(0, 12).map((c) => (
              <View key={c.category} style={styles.pillarRow}>
                <Text style={styles.pillarName}>{(c.label ?? c.category).toString()}</Text>
                <Text style={styles.pillarScore}>{c.score}</Text>
                <Text style={styles.pillarSummary}></Text>
              </View>
            ))}
          </>
        )}

        {explainItems.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Top Evidence Gaps</Text>
            {explainItems.slice(0, 6).map((i, idx) => (
              <View key={`${i.ruleLabel}-${idx}`} style={styles.recCard}>
                <Text style={styles.recProblem}>{i.ruleLabel}</Text>
                <Text style={styles.recPillar}>Points lost: {i.pointsLost}</Text>
              </View>
            ))}
          </>
        )}

        <Text style={styles.footer}>
          convaudit — AI-powered e-commerce audit platform — convaudit.ai
        </Text>
      </Page>
    </Document>
  );
}
