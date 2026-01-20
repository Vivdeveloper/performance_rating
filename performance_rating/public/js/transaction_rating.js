const RATING_DOC_CONFIG = {
	"Purchase Order": { party_from: "Supplier", party_field: "supplier" },
	"Purchase Receipt": { party_from: "Supplier", party_field: "supplier" },
	"Purchase Invoice": { party_from: "Supplier", party_field: "supplier" },
	"Sales Order": { party_from: "Customer", party_field: "customer" },
	"Delivery Note": { party_from: "Customer", party_field: "customer" },
	"Sales Invoice": { party_from: "Customer", party_field: "customer" },
};

const current_doctype = cur_frm && cur_frm.doctype;
if (current_doctype && RATING_DOC_CONFIG[current_doctype]) {
	const config = RATING_DOC_CONFIG[current_doctype];
	const handlers = {
		onload(frm) {
			queue_rating_prompt(frm);
		},
		refresh(frm) {
			queue_rating_prompt(frm);
		},
		status(frm) {
			maybe_prompt_for_rating(frm);
		},
	};

	if (config.party_field && config.party_field !== "name") {
		handlers[config.party_field] = (frm) => {
			// Trigger the prompt after the party is selected on new docs.
			maybe_prompt_for_rating(frm);
		};
	}

	frappe.ui.form.on(current_doctype, {
		...handlers,
	});
}

function queue_rating_prompt(frm) {
	// Wait for form data to finish loading before prompting.
	frappe.after_ajax(() => {
		if (frm.__rating_last_docname !== frm.doc.name) {
			frm.__rating_prompted_for = null;
			frm.__rating_prompt_pending_for = null;
			frm.__rating_last_docname = frm.doc.name;
		}
		maybe_prompt_for_rating(frm);
	});
}

function maybe_prompt_for_rating(frm) {
	const config = RATING_DOC_CONFIG[frm.doctype];
	if (!config) {
		return;
	}
	if (frm.is_new && frm.is_new()) {
		return;
	}
	if (frm.__rating_prompt_pending_for === frm.doc.name) {
		return;
	}
	if (frm.__rating_prompted_for === frm.doc.name) {
		return;
	}

	const party_name =
		config.party_field === "name" ? frm.doc.name : frm.doc[config.party_field];
	if (!party_name) {
		return;
	}

	frm.__rating_prompt_pending_for = frm.doc.name;
	frappe.call({
		method: "performance_rating.performance_rating.doctype.rating_log.rating_log.get_rating_setup",
		args: {
			reference_doctype: frm.doctype,
			reference_name: frm.doc.name,
			party_from: config.party_from,
			status: get_status_value(frm),
		},
		callback: (r) => {
			frm.__rating_prompt_pending_for = null;
			const message = r.message || {};
			const ratingItems = message.rating_items || [];
			const logItems = message.log_items || [];
			if (!ratingItems.length && !logItems.length) {
				return;
			}

			const logRatingsByParameter = {};
			(logItems || []).forEach((row) => {
				logRatingsByParameter[row.rating_parameter] = row.rating;
			});

			const rows = (ratingItems.length ? ratingItems : logItems).map((row) => ({
				rating_parameter: row.rating_parameter,
				rating: logRatingsByParameter[row.rating_parameter] ?? row.rating,
			}));

			const shouldShow = rows.some(
				(row) => row.rating === null || row.rating === undefined || row.rating === 0
			);
			if (!shouldShow) {
				return;
			}

			frm.__rating_prompted_for = frm.doc.name;
			show_rating_dialog(frm, rows, config, party_name);
		},
		error: () => {
			frm.__rating_prompt_pending_for = null;
		},
	});
}

function get_status_value(frm) {
	// Always rely on the standard status field for rating matching.
	return frm.doc.status;
}

function show_rating_dialog(frm, rows, config, party_name) {
	const dialog = new frappe.ui.Dialog({
		title: __("Update Rating"),
		fields: [
			{
				fieldname: "ratings",
				fieldtype: "Table",
				label: __("Ratings"),
				in_place_edit: true,
				cannot_add_rows: true,
				cannot_delete_rows: true,
				fields: [
					{
						fieldtype: "Link",
						fieldname: "rating_parameter",
						label: __("Rating Parameter"),
						options: "Rating Parameter",
						in_list_view: 1,
						read_only: 1,
					},
					{
						fieldtype: "Rating",
						fieldname: "rating",
						label: __("Rating"),
						in_list_view: 1,
					},
				],
			},
		],
		primary_action_label: __("Save"),
		primary_action: (values) => {
			frappe.call({
				method: "performance_rating.performance_rating.doctype.rating_log.rating_log.save_rating_log",
				args: {
					party_from: config.party_from,
					party_name: party_name,
					reference_doctype: frm.doctype,
					reference_name: frm.doc.name,
					ratings: values.ratings || [],
				},
				freeze: true,
				callback: () => {
					dialog.hide();
					frappe.show_alert({ message: __("Rating saved."), indicator: "green" });
				},
			});
		},
	});

	dialog.fields_dict.ratings.df.data = rows;
	dialog.fields_dict.ratings.grid.refresh();
	dialog.show();
}
