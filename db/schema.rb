# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20171205102821) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "coupon_claims", id: :serial, force: :cascade do |t|
    t.integer "coupon_id", null: false
    t.integer "user_id", null: false
    t.datetime "created_at"
    t.datetime "updated_at"
    t.index ["coupon_id", "user_id"], name: "index_coupon_claims_on_coupon_id_and_user_id"
    t.index ["coupon_id"], name: "index_coupon_claims_on_coupon_id"
    t.index ["user_id"], name: "index_coupon_claims_on_user_id"
  end

  create_table "coupons", id: :serial, force: :cascade do |t|
    t.string "code", null: false
    t.string "upgrades_to", null: false
    t.integer "upgrade_length_in_days", null: false
    t.date "expires_on"
    t.integer "maximum_claims"
    t.integer "coupon_claims_count", default: 0, null: false
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "games", id: :serial, force: :cascade do |t|
    t.integer "microbase_id", null: false
    t.string "fen"
    t.text "movetext", null: false
    t.string "white"
    t.string "black"
    t.integer "white_rating"
    t.integer "black_rating"
    t.string "tournament"
    t.string "location"
    t.integer "tournament_rounds"
    t.string "tournament_type"
    t.string "tournament_country"
    t.integer "round"
    t.integer "subround"
    t.string "result"
    t.date "date"
    t.text "unannotated_movetext"
    t.integer "move_count"
    t.integer "ply_count"
    t.integer "opening_id"
    t.string "opening_code", limit: 3
    t.string "token"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.boolean "has_comments"
    t.integer "position"
    t.integer "hits", default: 0, null: false
    t.index ["microbase_id", "position"], name: "index_games_on_microbase_id_and_position"
    t.index ["microbase_id"], name: "index_games_on_microbase_id"
  end

  create_table "memberships", id: :serial, force: :cascade do |t|
    t.integer "microbase_id", null: false
    t.integer "user_id", null: false
    t.string "role", null: false
    t.integer "inviter_id"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.index ["microbase_id"], name: "index_memberships_on_microbase_id"
    t.index ["user_id"], name: "index_memberships_on_user_id"
  end

  create_table "microbases", id: :serial, force: :cascade do |t|
    t.string "name"
    t.string "token"
    t.datetime "last_accessed_at"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.text "player_names_json"
    t.text "preamble"
    t.index ["token"], name: "index_microbases_on_token", unique: true
  end

  create_table "openings", id: :serial, force: :cascade do |t|
    t.string "code", limit: 3, null: false
    t.string "name", null: false
    t.string "moves", null: false
  end

  create_table "taggings", id: :serial, force: :cascade do |t|
    t.integer "tag_id"
    t.string "taggable_type"
    t.integer "taggable_id"
    t.string "tagger_type"
    t.integer "tagger_id"
    t.string "context", limit: 128
    t.datetime "created_at"
    t.index ["context"], name: "index_taggings_on_context"
    t.index ["tag_id", "taggable_id", "taggable_type", "context", "tagger_id", "tagger_type"], name: "taggings_idx", unique: true
    t.index ["tag_id"], name: "index_taggings_on_tag_id"
    t.index ["taggable_id", "taggable_type", "context"], name: "index_taggings_on_taggable_id_and_taggable_type_and_context"
    t.index ["taggable_id", "taggable_type", "tagger_id", "context"], name: "taggings_idy"
    t.index ["taggable_id"], name: "index_taggings_on_taggable_id"
    t.index ["taggable_type"], name: "index_taggings_on_taggable_type"
    t.index ["tagger_id", "tagger_type"], name: "index_taggings_on_tagger_id_and_tagger_type"
    t.index ["tagger_id"], name: "index_taggings_on_tagger_id"
  end

  create_table "tags", id: :serial, force: :cascade do |t|
    t.string "name"
    t.integer "taggings_count", default: 0
    t.index ["name"], name: "index_tags_on_name", unique: true
  end

  create_table "user_upgrades", force: :cascade do |t|
    t.string "level", null: false
    t.integer "user_id", null: false
    t.date "upgraded_until", null: false
    t.string "coupon_code"
    t.string "stripe_customer_id"
    t.string "stripe_charge_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "upgraded_until"], name: "index_user_upgrades_on_user_id_and_upgraded_until"
  end

  create_table "users", id: :serial, force: :cascade do |t|
    t.string "email", null: false
    t.string "first_name", null: false
    t.string "last_name", null: false
    t.boolean "admin", default: false, null: false
    t.string "password_digest", null: false
    t.datetime "confirmed_at"
    t.string "confirmed_with_ip"
    t.string "confirmation_token"
    t.string "recovery_token"
    t.string "account", default: "free", null: false
    t.datetime "upgraded_until"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string "upgraded_by"
    t.string "color_scheme", default: "Default", null: false
    t.boolean "default_to_training_mode", default: false, null: false
    t.index ["email"], name: "index_users_on_email", unique: true
  end

end
