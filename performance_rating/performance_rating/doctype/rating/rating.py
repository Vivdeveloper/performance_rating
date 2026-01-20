# Copyright (c) 2026, Vivek Choudhary and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class Rating(Document):
	def validate(self):
		if self.is_active:
			if self.status:
				frappe.db.sql(
					"""
					UPDATE `tabRating`
					SET is_active = 0
					WHERE doctype_type = %s
						AND status = %s
						AND name != %s
					""",
					(self.doctype_type, self.status, self.name),
				)
			else:
				frappe.db.sql(
					"""
					UPDATE `tabRating`
					SET is_active = 0
					WHERE doctype_type = %s
						AND (status IS NULL OR status = "")
						AND name != %s
					""",
					(self.doctype_type, self.name),
				)
