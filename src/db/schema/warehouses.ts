import { pgTable, uuid, varchar, text, boolean, integer, timestamp } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.new';
import { users } from './users.new';

/**
 * Organizations_Warehouses_Locations Table
 * Warehouse locations belonging to organizations
 */
export const organizationsWarehousesLocations = pgTable('organizations_warehouses_locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileImage: varchar('profile_image', { length: 500 }),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  defaultOptions: boolean('default_options').default(false).notNull(), // Flag to indicate use of default settings
  name: varchar('name', { length: 255 }),
  phoneNumber: varchar('phone_number', { length: 30 }),
  mobileNumber: varchar('mobile_number', { length: 30 }),
  differentWhatsAppNumber: boolean('different_whatsapp_number').default(false).notNull(),
  whatsAppNumber: varchar('whatsapp_number', { length: 30 }),
  email: varchar('email', { length: 255 }),
  additionalInformation: text('additional_information'),
  isActive: boolean('is_active').default(true).notNull(),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  isLocked: boolean('is_locked').default(false).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type OrganizationsWarehousesLocationsSelect = typeof organizationsWarehousesLocations.$inferSelect;
export type OrganizationsWarehousesLocationsInsert = typeof organizationsWarehousesLocations.$inferInsert;

/**
 * Warehouses_Default_Options Table
 * Default configuration options for warehouse operations
 */
export const warehousesDefaultOptions = pgTable('warehouses_default_options', {
  id: uuid('id').primaryKey().defaultRandom(),
  warehouseId: uuid('warehouse_id').notNull().references(() => organizationsWarehousesLocations.id),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  defaultOptionsName: varchar('default_options_name', { length: 255 }),
  
  // Signature requests
  requestForDeliverySignature: boolean('request_for_delivery_signature').default(false).notNull(),
  requestForReturnSignature: boolean('request_for_return_signature').default(false).notNull(),
  requestForTransferSignature: boolean('request_for_transfer_signature').default(false).notNull(),
  
  // Package image uploads
  requestToUploadPackageImageReceive: boolean('request_to_upload_package_image_receive').default(false).notNull(),
  requestToUploadPackageImageDeliver: boolean('request_to_upload_package_image_deliver').default(false).notNull(),
  requestToUploadPackageImageReturn: boolean('request_to_upload_package_image_return').default(false).notNull(),
  requestToUploadPackageImageTransfer: boolean('request_to_upload_package_image_transfer').default(false).notNull(),
  
  // Shipping label uploads
  requestToUploadShippingLabelReceive: boolean('request_to_upload_shipping_label_receive').default(false).notNull(),
  requestToUploadShippingLabelReturn: boolean('request_to_upload_shipping_label_return').default(false).notNull(),
  requestToUploadShippingLabelTransfer: boolean('request_to_upload_shipping_label_transfer').default(false).notNull(),
  
  // Tracking number requests
  requestForTrackingNumberReceive: boolean('request_for_tracking_number_receive').default(false).notNull(),
  requestForTrackingNumberReturn: boolean('request_for_tracking_number_return').default(false).notNull(),
  requestForTrackingNumberTransfer: boolean('request_for_tracking_number_transfer').default(false).notNull(),
  
  // Carrier driver name requests
  requestForCarrierDriversNameReceive: boolean('request_for_carrier_drivers_name_receive').default(false).notNull(),
  requestForCarrierDriversNameReturn: boolean('request_for_carrier_drivers_name_return').default(false).notNull(),
  requestForCarrierDriversNameTransfer: boolean('request_for_carrier_drivers_name_transfer').default(false).notNull(),
  
  // Carrier driver identification uploads
  requestUploadCarrierDriversIdentificationReceive: boolean('request_upload_carrier_drivers_identification_receive').default(false).notNull(),
  requestUploadCarrierDriversIdentificationReturn: boolean('request_upload_carrier_drivers_identification_return').default(false).notNull(),
  requestUploadCarrierDriversIdentificationTransfer: boolean('request_upload_carrier_drivers_identification_transfer').default(false).notNull(),
  
  // Plate number uploads
  requestUploadPlateNumberReceive: boolean('request_upload_plate_number_receive').default(false).notNull(),
  requestUploadPlateNumberReturn: boolean('request_upload_plate_number_return').default(false).notNull(),
  requestUploadPlateNumberTransfer: boolean('request_upload_plate_number_transfer').default(false).notNull(),
  
  // Insurance proof requests
  requestForInsuranceProofReceive: boolean('request_for_insurance_proof_receive').default(false).notNull(),
  requestForInsuranceProofReturn: boolean('request_for_insurance_proof_return').default(false).notNull(),
  requestForInsuranceProofTransfer: boolean('request_for_insurance_proof_transfer').default(false).notNull(),
  
  // Memo requests
  requestForMemoReceive: boolean('request_for_memo_receive').default(false).notNull(),
  requestForMemoDeliver: boolean('request_for_memo_deliver').default(false).notNull(),
  requestForMemoReturn: boolean('request_for_memo_return').default(false).notNull(),
  requestForMemoTransfer: boolean('request_for_memo_transfer').default(false).notNull(),
  
  // Other options
  setAsReadyToPickupWhenReceivePackage: boolean('set_as_ready_to_pickup_when_receive_package').default(false).notNull(),
  keepPackageForHowLong: integer('keep_package_for_how_long'), // Duration in days
  
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type WarehousesDefaultOptionsSelect = typeof warehousesDefaultOptions.$inferSelect;
export type WarehousesDefaultOptionsInsert = typeof warehousesDefaultOptions.$inferInsert;

/**
 * Warehouses_Storages_Layouts Table
 * Storage location layout within a warehouse (Zone, Isle, Shelf, Bin)
 */
export const warehousesStoragesLayouts = pgTable('warehouses_storages_layouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileImage: varchar('profile_image', { length: 500 }),
  warehouseId: uuid('warehouse_id').notNull().references(() => organizationsWarehousesLocations.id),
  zone: varchar('zone', { length: 50 }),
  isle: varchar('isle', { length: 50 }),
  shelf: varchar('shelf', { length: 50 }),
  bin: varchar('bin', { length: 50 }),
  additionalInformation: text('additional_information'),
  isActive: boolean('is_active').default(true).notNull(),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  isLocked: boolean('is_locked').default(false).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type WarehousesStoragesLayoutsSelect = typeof warehousesStoragesLayouts.$inferSelect;
export type WarehousesStoragesLayoutsInsert = typeof warehousesStoragesLayouts.$inferInsert;
