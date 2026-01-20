// Copyright (c) 2026, Vivek Choudhary and contributors
// For license information, please see license.txt

frappe.ui.form.on("Rating", {
	refresh(frm) {
		set_doctype_type_query(frm);
		set_status_options(frm);
	},
	doctype_type(frm) {
		frm.set_value("status", "");
		set_doctype_type_query(frm);
		set_status_options(frm);
	},
});

function set_doctype_type_query(frm) {
	// Limit selection to supported transaction doctypes (exclude Employee).
	frm.set_query("doctype_type", () => ({
		filters: [
			[
				"DocType",
				"name",
				"in",
				[
					"Sales Order",
					"Delivery Note",
					"Sales Invoice",
					"Purchase Order",
					"Purchase Receipt",
					"Purchase Invoice",
				],
			],
		],
	}));
}

function set_status_options(frm) {
	const doctype = frm.doc.doctype_type;
	if (!doctype) {
		frm.set_df_property("status", "options", "");
		return;
	}

	frappe.model.with_doctype(doctype, () => {
		// Use the doctype's standard status field for options.
		const meta = frappe.get_meta(doctype);
		const status_field = (meta?.fields || []).find((df) => df.fieldname === "status");
		const options = status_field?.options || "";
		frm.set_df_property("status", "options", options);
	});
}
