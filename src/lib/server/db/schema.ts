import { sqliteTable, text, integer, primaryKey, unique } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import type { Params, MidiItem } from '$lib/frontend/Synth';

export const sounds = sqliteTable('sounds', {
	id: text().primaryKey(),
	params: text({ mode: 'json' }).$type<Params>().notNull(),
	notes: text({ mode: 'json' }).$type<MidiItem[]>()
});

export const tasks = sqliteTable('tasks', {
	id: text().primaryKey(),
	descriptor: text().notNull(),
	sessionId: text('session_id').references(() => session.id),
	tutorial: integer({ mode: 'boolean' }).default(false).notNull()
});

export const taskSounds = sqliteTable(
	'task_sounds',
	{
		taskId: text('task_id')
			.notNull()
			.references(() => tasks.id),
		soundId: text('sound_id')
			.notNull()
			.references(() => sounds.id)
	},
	(t) => ({
		pk: primaryKey({ columns: [t.taskId, t.soundId] }) // composite PK
	})
);

export const tasksRelations = relations(tasks, ({ many, one }) => ({
	sounds: many(taskSounds),
	session: one(session, {
		fields: [tasks.sessionId],
		references: [session.id]
	}),
	annotations: many(annotations)
}));

export const soundsRelations = relations(sounds, ({ many }) => ({ tasks: many(taskSounds) }));

export const taskSoundsRelations = relations(taskSounds, ({ one }) => ({
	task: one(tasks, {
		fields: [taskSounds.taskId],
		references: [tasks.id]
	}),
	sound: one(sounds, {
		fields: [taskSounds.soundId],
		references: [sounds.id]
	})
}));

export const annotations = sqliteTable(
	'annotations',
	{
		rank: text({ mode: 'json' }).$type<Array<{ id: number; sound: string }>>().notNull(),
		annotatorId: text('annotator_id')
			.notNull()
			.references(() => session.id),
		taskId: text('task_id')
			.notNull()
			.references(() => tasks.id),
		status: text().$type<'pending' | 'done'>().notNull(),
		createdAt: integer({ mode: 'timestamp_ms' }).notNull()
	},
	(table) => [primaryKey({ name: 'id', columns: [table.taskId, table.annotatorId] })]
);

export const annotationsRelations = relations(annotations, ({ one }) => ({
	annotator: one(session, {
		fields: [annotations.annotatorId],
		references: [session.id]
	}),
	task: one(tasks, {
		fields: [annotations.taskId],
		references: [tasks.id]
	})
}));

export const questionnaires = sqliteTable(
	'questionnaires',
	{
		id: integer().primaryKey({ autoIncrement: true }),
		questionnaire: text({ mode: 'json' }).notNull(),
		annotatorId: text('annotator_id')
			.notNull()
			.references(() => session.id),
		createdAt: integer({ mode: 'timestamp_ms' }).notNull()
	},
	(t) => ({
		annotatorUnique: unique().on(t.annotatorId)
	})
);

export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	admin: integer({ mode: 'boolean' }).notNull(),
	createdAt: integer({ mode: 'timestamp_ms' }).notNull()
});

export const sessionRelations = relations(session, ({ many, one }) => ({
	tasks: many(tasks),
	annotations: many(annotations),
	questionnaire: one(questionnaires, {
		fields: [session.id],
		references: [questionnaires.annotatorId]
	})
}));
