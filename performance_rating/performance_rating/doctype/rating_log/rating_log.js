// Copyright (c) 2026, Vivek Choudhary and contributors
// For license information, please see license.txt

frappe.ui.form.on("Rating Log", {
	refresh(frm) {
		set_reference_doctype_options(frm);
		set_reference_name_query(frm);
	},
	party_from(frm) {
		frm.__rating_prompted = false;
		frm.set_value("ratings", []);
		frm.set_value("party_name", "");
		frm.set_value("reference_doctype", "");
		frm.set_value("reference_name", "");
		set_reference_doctype_options(frm);
	},
	party_name(frm) {
		set_reference_name_query(frm);
		if (frm.doc.party_from === "Employee" && frm.doc.party_name) {
			frm.set_value("reference_doctype", "Employee");
			frm.set_value("reference_name", frm.doc.party_name);
		}
	},
	reference_doctype(frm) {
		frm.set_value("reference_name", "");
		set_reference_name_query(frm);
	},
});

function set_reference_doctype_options(frm) {
	// Limit reference doctypes based on the selected party source.
	const options_by_party = {
		Supplier: ["Purchase Order", "Purchase Receipt", "Purchase Invoice"],
		Customer: ["Sales Order", "Delivery Note", "Sales Invoice"],
		Employee: ["Employee"],
	};
	const options = options_by_party[frm.doc.party_from] || [];
	frm.set_df_property("reference_doctype", "options", options.join("\n"));
	if (options.length === 1) {
		frm.set_value("reference_doctype", options[0]);
	}
}

function set_reference_name_query(frm) {
	const reference_doctype = frm.doc.reference_doctype;
	const party_name = frm.doc.party_name;
	if (!reference_doctype || !party_name) {
		return;
	}

	// Map each reference doctype to the party field it should match.
	const party_field_by_doctype = {
		"Purchase Order": "supplier",
		"Purchase Receipt": "supplier",
		"Purchase Invoice": "supplier",
		"Sales Order": "customer",
		"Delivery Note": "customer",
		"Sales Invoice": "customer",
		Employee: "name",
	};

	const party_field = party_field_by_doctype[reference_doctype];
	if (!party_field) {
		return;
	}

	frm.set_query("reference_name", () => ({
		filters: [[reference_doctype, party_field, "=", party_name]],
	}));
}
