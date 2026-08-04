import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatMoney } from "@/lib/format";
import type { PaymentMethod } from "@/types/database";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 32 },
  company: { fontSize: 16, fontWeight: 700 },
  title: { fontSize: 18, fontWeight: 700, textAlign: "right" },
  meta: { textAlign: "right", color: "#555", marginTop: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: "#ddd" },
  label: { color: "#555" },
  amount: { fontSize: 16, fontWeight: 700, marginTop: 24 },
});

export interface ReceiptDocumentProps {
  invoiceNumber: string;
  customerName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  referenceNumber: string | null;
  balanceDue: number;
}

export function ReceiptDocument(props: ReceiptDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.company}>CrossTech Systems</Text>
          <View>
            <Text style={styles.title}>RECEIPT</Text>
            <Text style={styles.meta}>For invoice {props.invoiceNumber}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Received from</Text>
          <Text>{props.customerName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Payment date</Text>
          <Text>{props.paymentDate}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Method</Text>
          <Text style={{ textTransform: "capitalize" }}>{props.paymentMethod}</Text>
        </View>
        {props.referenceNumber && (
          <View style={styles.row}>
            <Text style={styles.label}>Reference</Text>
            <Text>{props.referenceNumber}</Text>
          </View>
        )}
        <View style={styles.row}>
          <Text style={styles.label}>Remaining balance on invoice</Text>
          <Text>{formatMoney(props.balanceDue)}</Text>
        </View>

        <Text style={styles.amount}>Amount received: {formatMoney(props.amount)}</Text>
      </Page>
    </Document>
  );
}
