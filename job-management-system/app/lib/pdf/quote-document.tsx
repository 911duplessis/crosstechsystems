import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatMoney } from "@/lib/format";
import type { DiscountType, LineItemType } from "@/types/database";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  company: { fontSize: 16, fontWeight: 700 },
  title: { fontSize: 18, fontWeight: 700, textAlign: "right" },
  meta: { textAlign: "right", color: "#555", marginTop: 4 },
  section: { marginBottom: 16 },
  label: { color: "#555", marginBottom: 2 },
  table: { marginTop: 8 },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    paddingBottom: 4,
    marginBottom: 4,
    fontWeight: 700,
  },
  row: { flexDirection: "row", paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: "#ddd" },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: "right" },
  colPrice: { flex: 1, textAlign: "right" },
  colTotal: { flex: 1, textAlign: "right" },
  totals: { marginTop: 12, alignItems: "flex-end" },
  totalsRow: { flexDirection: "row", width: 200, justifyContent: "space-between", marginBottom: 2 },
  totalsFinal: { fontWeight: 700, borderTopWidth: 1, borderTopColor: "#333", paddingTop: 4 },
  terms: { marginTop: 24, fontSize: 9, color: "#555" },
});

interface LineItem {
  item_type: LineItemType;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface QuoteDocumentProps {
  quoteNumber: string;
  issueDate: string;
  expiryDate: string | null;
  customerName: string;
  customerAddress?: string | null;
  lineItems: LineItem[];
  subtotal: number;
  discountType: DiscountType;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  termsAndConditions?: string | null;
}

export function QuoteDocument(props: QuoteDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.company}>CrossTech Systems</Text>
          </View>
          <View>
            <Text style={styles.title}>QUOTE</Text>
            <Text style={styles.meta}>{props.quoteNumber}</Text>
            <Text style={styles.meta}>Issued: {props.issueDate}</Text>
            {props.expiryDate && <Text style={styles.meta}>Valid until: {props.expiryDate}</Text>}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Quote for</Text>
          <Text>{props.customerName}</Text>
          {props.customerAddress && <Text>{props.customerAddress}</Text>}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colPrice}>Unit price</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>
          {props.lineItems.map((item, i) => (
            <View key={i} style={styles.row}>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{formatMoney(item.unit_price)}</Text>
              <Text style={styles.colTotal}>{formatMoney(item.line_total)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalsRow}>
            <Text>Subtotal</Text>
            <Text>{formatMoney(props.subtotal)}</Text>
          </View>
          {props.discountType !== "none" && (
            <View style={styles.totalsRow}>
              <Text>Discount</Text>
              <Text>-{formatMoney(props.discountAmount)}</Text>
            </View>
          )}
          <View style={styles.totalsRow}>
            <Text>VAT ({props.taxRate}%)</Text>
            <Text>{formatMoney(props.taxAmount)}</Text>
          </View>
          <View style={[styles.totalsRow, styles.totalsFinal]}>
            <Text>Total</Text>
            <Text>{formatMoney(props.total)}</Text>
          </View>
        </View>

        {props.termsAndConditions && (
          <View style={styles.terms}>
            <Text style={styles.label}>Terms and conditions</Text>
            <Text>{props.termsAndConditions}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
