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
	const allowed_doctypes = [
		"Sales Order",
		"Delivery Note",
		"Sales Invoice",
		"Purchase Order",
		"Purchase Receipt",
		"Purchase Invoice",
		"Employee",
	];
	frm.set_query("doctype_type", () => ({
		filters: [["DocType", "name", "in", allowed_doctypes]],
	}));
}

function set_status_options(frm) {
	const doctype = frm.doc.doctype_type;
	if (!doctype) {
		frm.set_df_property("status", "options", "");
		return;
	}

		frappe.model.with_doctype(doctype, () => {
			const current_doctype = doctype;
			const workflow_field = frappe.workflow.get_state_fieldname(doctype);
			if (workflow_field) {
				frappe.workflow.setup(doctype);
				const workflow = frappe.workflow.workflows[doctype];
				const workflow_states = (workflow?.states || []).map((row) => row.state);
				if (workflow_states.length) {
					// Prefer cached workflow states when available.
					frm.set_df_property("status", "options", workflow_states.join("\n"));
					return;
				}
			}

			// Fallback to server lookup when workflow metadata isn't cached.
			fetch_workflow_states(doctype).then((states) => {
				if (frm.doc.doctype_type !== current_doctype) {
					return;
				}
				if (states.length) {
					frm.set_df_property("status", "options", states.join("\n"));
					return;
				}

			const meta = frappe.get_meta(doctype);
			const status_field = (meta?.fields || []).find((df) => df.fieldname === "status");
			const workflow_state_field = workflow_field
				? (meta?.fields || []).find((df) => df.fieldname === workflow_field)
				: null;
			const options = status_field?.options || workflow_state_field?.options || "";
			frm.set_df_property("status", "options", options);
		});
	});
}

function fetch_workflow_states(doctype) {
	return frappe.db
		// Resolve active workflow name, then fetch its states.
		.get_value("Workflow", { document_type: doctype, is_active: 1 }, ["name"])
		.then((response) => {
			const workflow_name = response?.message?.name;
			if (!workflow_name) {
				return [];
			}
			return frappe.db.get_list("Workflow State", {
				filters: { parent: workflow_name },
				fields: ["state"],
				order_by: "idx",
			});
		})
		.then((states) => (states || []).map((row) => row.state))
		.catch(() => []);
}
