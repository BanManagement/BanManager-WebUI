exports.up = async function (db) {
  await db.createTable('bm_web_notification_rules', {
    columns: {
      id: { type: 'bigint', length: 20, notNull: true, autoIncrement: true, primaryKey: true },
      type: { type: 'string', length: 255, notNull: true },
      server_id: {
        type: 'string',
        notNull: false,
        foreignKey: {
          name: 'bm_web_notification_rules_server_id_fk',
          table: 'bm_web_servers',
          mapping: 'id',
          rules: {
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
          }
        }
      },
      created: { type: 'int', length: 10, notNull: true },
      updated: { type: 'int', length: 10, notNull: true }
    },
    charset: 'utf8'
  })

  await db.addIndex('bm_web_notification_rules', 'bm_web_notification_rules_type_idx', ['type'])

  await db.createTable('bm_web_notification_rule_roles', {
    columns: {
      id: { type: 'bigint', length: 20, notNull: true, primaryKey: true, autoIncrement: true },
      notification_rule_id: {
        type: 'bigint',
        notNull: true,
        foreignKey: {
          name: 'bm_web_notification_rules_notification_rule_id_fk',
          table: 'bm_web_notification_rules',
          mapping: 'id',
          rules: {
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
          }
        }
      },
      role_id: {
        type: 'int',
        unsigned: true,
        notNull: true,
        foreignKey: {
          name: 'bm_web_notification_rule_roles_role_id_fk',
          table: 'bm_web_roles',
          mapping: 'role_id',
          rules: {
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
          }
        }
      }
    },
    charset: 'utf8'
  })

  await db.addIndex('bm_web_notification_rule_roles', 'bm_web_notification_rule_roles_rule_role_idx', ['notification_rule_id', 'role_id'], true)
}

exports.down = async function (db) {
  await db.dropTable('bm_web_notification_rule_roles')
  await db.dropTable('bm_web_notification_rules')
}

exports._meta = {
  version: 1
}
