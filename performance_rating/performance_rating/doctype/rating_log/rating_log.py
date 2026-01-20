# Copyright (c) 2026, Vivek Choudhary and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class RatingLog(Document):
	def on_update(self):
		self.update_party_average_rating()

	def update_party_average_rating(self):
		# Update the party's custom average rating from this log's items.
		if not self.party_from or not self.party_name:
			return
		if self.party_from not in {"Supplier", "Customer"}:
			return

		meta = frappe.get_meta(self.party_from)
		if not meta.get_field("custom_avarage_rating"):
			return

		ratings = [row.rating for row in self.ratings if row.rating is not None]
		if not ratings:
			return

		average = sum(ratings) / len(ratings)
		frappe.db.sql(
			"""
			UPDATE `tab{doctype}`
			SET custom_avarage_rating = %s
			WHERE name = %s
			""".format(doctype=self.party_from),
			(average, self.party_name),
		)


def delete_rating_logs_for_reference(doc, method=None):
	# delete logs when the referenced document is removed.
	reference_doctype = doc.doctype
	reference_name = doc.name
	log_names = frappe.get_all(
		"Rating Log",
		filters={"reference_doctype": reference_doctype, "reference_name": reference_name},
		pluck="name",
	)
	for log_name in log_names:
		frappe.delete_doc("Rating Log", log_name, ignore_permissions=True, force=1)


@frappe.whitelist()
def get_rating_setup(
	doctype_type=None,
	party_from=None,
	reference_doctype=None,
	reference_name=None,
	status=None,
):
	rating_doctype = reference_doctype or doctype_type or party_from
	if not rating_doctype:
		return {"rating_items": [], "rating_log": None, "log_items": []}

	rating_filters = {"doctype_type": rating_doctype, "is_active": 1}
	if status:
		rating_filters["status"] = status

	rating_name = frappe.db.get_value("Rating", rating_filters, "name")
	if not rating_name:
		return {"rating_items": [], "rating_log": None, "log_items": []}

	rating_items = frappe.get_all(
		"Rating Item",
		filters={"parent": rating_name, "parenttype": "Rating"},
		fields=["rating_parameter"],
		order_by="idx",
	)

	rating_log = None
	log_items = []
	if reference_doctype and reference_name:
		rating_log = frappe.db.get_value(
			"Rating Log",
			{"reference_doctype": reference_doctype, "reference_name": reference_name},
			"name",
		)
	if rating_log:
		log_items = frappe.get_all(
			"Rating Log Item",
			filters={"parent": rating_log, "parenttype": "Rating Log"},
			fields=["name", "rating_parameter", "rating"],
			order_by="idx",
		)

	return {"rating_items": rating_items, "rating_log": rating_log, "log_items": log_items}


@frappe.whitelist()
def save_rating_log(
	ratings,
	party_from=None,
	party_name=None,
	reference_doctype=None,
	reference_name=None,
	doctype_type=None,
):
	ratings = frappe.parse_json(ratings)
	if not ratings:
		frappe.throw("Ratings are required.")

	if not reference_doctype and doctype_type:
		reference_doctype = doctype_type

	log_name = frappe.db.get_value(
		"Rating Log",
		{"reference_doctype": reference_doctype, "reference_name": reference_name},
		"name",
	)
	if log_name:
		doc = frappe.get_doc("Rating Log", log_name)
		doc.ratings = []
	else:
		doc = frappe.new_doc("Rating Log")
		doc.party_from = party_from
		doc.party_name = party_name
		doc.reference_doctype = reference_doctype
		doc.reference_name = reference_name
	if party_from:
		doc.party_from = party_from
	if party_name:
		doc.party_name = party_name
	if reference_doctype:
		doc.reference_doctype = reference_doctype
	if reference_name:
		doc.reference_name = reference_name

	for row in ratings:
		rating_parameter = row.get("rating_parameter")
		if not rating_parameter:
			continue
		doc.append(
			"ratings",
			{"rating_parameter": rating_parameter, "rating": row.get("rating")},
		)

	doc.save()
	return doc.name
