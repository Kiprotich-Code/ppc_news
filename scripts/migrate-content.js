"use strict";
/**
 * Content Migration Script for TipTap Implementation
 *
 * This script migrates existing plain text content in courses, sections, and lessons
 * to TipTap JSON format.
 *
 * Usage:
 * 1. Run this script in a Node.js environment with database access
 * 2. Or use the provided functions individually in your admin panel
 *
 * IMPORTANT: Always backup your database before running migration!
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateCourseDescriptions = migrateCourseDescriptions;
exports.migrateSectionDescriptions = migrateSectionDescriptions;
exports.migrateLessonContent = migrateLessonContent;
exports.runFullMigration = runFullMigration;
exports.analyzeMigrationNeeds = analyzeMigrationNeeds;
var client_1 = require("@prisma/client");
var contentMigration_1 = require("../lib/contentMigration");
var prisma = new client_1.PrismaClient();
/**
 * Migrate all course descriptions to TipTap format
 */
function migrateCourseDescriptions() {
    return __awaiter(this, void 0, void 0, function () {
        var courses, updated, _i, courses_1, course, updates, tiptapContent, tiptapContent, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🔄 Starting course description migration...');
                    return [4 /*yield*/, prisma.course.findMany({
                            where: {
                                OR: [
                                    { description: { not: null } },
                                    { shortDescription: { not: null } }
                                ]
                            },
                            select: {
                                id: true,
                                description: true,
                                shortDescription: true
                            }
                        })];
                case 1:
                    courses = _a.sent();
                    updated = 0;
                    _i = 0, courses_1 = courses;
                    _a.label = 2;
                case 2:
                    if (!(_i < courses_1.length)) return [3 /*break*/, 8];
                    course = courses_1[_i];
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 6, , 7]);
                    updates = {};
                    // Migrate description
                    if (course.description && !(0, contentMigration_1.isTipTapContent)(course.description)) {
                        tiptapContent = isLikelyMarkdown(course.description)
                            ? (0, contentMigration_1.convertMarkdownToTipTap)(course.description)
                            : (0, contentMigration_1.convertPlainTextToTipTap)(course.description);
                        updates.description = tiptapContent;
                    }
                    // Migrate short description
                    if (course.shortDescription && !(0, contentMigration_1.isTipTapContent)(course.shortDescription)) {
                        tiptapContent = (0, contentMigration_1.convertPlainTextToTipTap)(course.shortDescription);
                        updates.shortDescription = tiptapContent;
                    }
                    if (!(Object.keys(updates).length > 0)) return [3 /*break*/, 5];
                    return [4 /*yield*/, prisma.course.update({
                            where: { id: course.id },
                            data: updates
                        })];
                case 4:
                    _a.sent();
                    updated++;
                    console.log("\u2705 Updated course: ".concat(course.id));
                    _a.label = 5;
                case 5: return [3 /*break*/, 7];
                case 6:
                    error_1 = _a.sent();
                    console.error("\u274C Error updating course ".concat(course.id, ":"), error_1);
                    return [3 /*break*/, 7];
                case 7:
                    _i++;
                    return [3 /*break*/, 2];
                case 8:
                    console.log("\uD83D\uDCCA Course migration complete: ".concat(updated, "/").concat(courses.length, " updated"));
                    return [2 /*return*/, updated];
            }
        });
    });
}
/**
 * Migrate all section descriptions to TipTap format
 */
function migrateSectionDescriptions() {
    return __awaiter(this, void 0, void 0, function () {
        var sections, updated, _i, sections_1, section, tiptapContent, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🔄 Starting section description migration...');
                    return [4 /*yield*/, prisma.courseSection.findMany({
                            where: {
                                description: { not: null }
                            },
                            select: {
                                id: true,
                                description: true
                            }
                        })];
                case 1:
                    sections = _a.sent();
                    updated = 0;
                    _i = 0, sections_1 = sections;
                    _a.label = 2;
                case 2:
                    if (!(_i < sections_1.length)) return [3 /*break*/, 8];
                    section = sections_1[_i];
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 6, , 7]);
                    if (!(section.description && !(0, contentMigration_1.isTipTapContent)(section.description))) return [3 /*break*/, 5];
                    tiptapContent = isLikelyMarkdown(section.description)
                        ? (0, contentMigration_1.convertMarkdownToTipTap)(section.description)
                        : (0, contentMigration_1.convertPlainTextToTipTap)(section.description);
                    return [4 /*yield*/, prisma.courseSection.update({
                            where: { id: section.id },
                            data: { description: tiptapContent }
                        })];
                case 4:
                    _a.sent();
                    updated++;
                    console.log("\u2705 Updated section: ".concat(section.id));
                    _a.label = 5;
                case 5: return [3 /*break*/, 7];
                case 6:
                    error_2 = _a.sent();
                    console.error("\u274C Error updating section ".concat(section.id, ":"), error_2);
                    return [3 /*break*/, 7];
                case 7:
                    _i++;
                    return [3 /*break*/, 2];
                case 8:
                    console.log("\uD83D\uDCCA Section migration complete: ".concat(updated, "/").concat(sections.length, " updated"));
                    return [2 /*return*/, updated];
            }
        });
    });
}
/**
 * Migrate all lesson content and descriptions to TipTap format
 */
function migrateLessonContent() {
    return __awaiter(this, void 0, void 0, function () {
        var lessons, updated, _i, lessons_1, lesson, updates, tiptapContent, tiptapContent, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🔄 Starting lesson content migration...');
                    return [4 /*yield*/, prisma.lesson.findMany({
                            where: {
                                OR: [
                                    { content: { not: null } },
                                    { description: { not: null } }
                                ]
                            },
                            select: {
                                id: true,
                                content: true,
                                description: true,
                                type: true
                            }
                        })];
                case 1:
                    lessons = _a.sent();
                    updated = 0;
                    _i = 0, lessons_1 = lessons;
                    _a.label = 2;
                case 2:
                    if (!(_i < lessons_1.length)) return [3 /*break*/, 8];
                    lesson = lessons_1[_i];
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 6, , 7]);
                    updates = {};
                    // Migrate lesson content (only for ARTICLE type)
                    if (lesson.type === 'ARTICLE' && lesson.content && !(0, contentMigration_1.isTipTapContent)(lesson.content)) {
                        tiptapContent = isLikelyMarkdown(lesson.content)
                            ? (0, contentMigration_1.convertMarkdownToTipTap)(lesson.content)
                            : (0, contentMigration_1.convertPlainTextToTipTap)(lesson.content);
                        updates.content = tiptapContent;
                    }
                    // Migrate lesson description
                    if (lesson.description && !(0, contentMigration_1.isTipTapContent)(lesson.description)) {
                        tiptapContent = isLikelyMarkdown(lesson.description)
                            ? (0, contentMigration_1.convertMarkdownToTipTap)(lesson.description)
                            : (0, contentMigration_1.convertPlainTextToTipTap)(lesson.description);
                        updates.description = tiptapContent;
                    }
                    if (!(Object.keys(updates).length > 0)) return [3 /*break*/, 5];
                    return [4 /*yield*/, prisma.lesson.update({
                            where: { id: lesson.id },
                            data: updates
                        })];
                case 4:
                    _a.sent();
                    updated++;
                    console.log("\u2705 Updated lesson: ".concat(lesson.id));
                    _a.label = 5;
                case 5: return [3 /*break*/, 7];
                case 6:
                    error_3 = _a.sent();
                    console.error("\u274C Error updating lesson ".concat(lesson.id, ":"), error_3);
                    return [3 /*break*/, 7];
                case 7:
                    _i++;
                    return [3 /*break*/, 2];
                case 8:
                    console.log("\uD83D\uDCCA Lesson migration complete: ".concat(updated, "/").concat(lessons.length, " updated"));
                    return [2 /*return*/, updated];
            }
        });
    });
}
/**
 * Run complete migration for all content types
 */
function runFullMigration() {
    return __awaiter(this, void 0, void 0, function () {
        var stats, _a, _b, _c, error_4;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    console.log('🚀 Starting full content migration to TipTap format...');
                    console.log('⚠️  Make sure you have backed up your database!');
                    stats = {
                        coursesUpdated: 0,
                        sectionsUpdated: 0,
                        lessonsUpdated: 0,
                        errors: []
                    };
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 5, 6, 8]);
                    // Migrate courses
                    _a = stats;
                    return [4 /*yield*/, migrateCourseDescriptions()
                        // Migrate sections
                    ];
                case 2:
                    // Migrate courses
                    _a.coursesUpdated = _d.sent();
                    // Migrate sections
                    _b = stats;
                    return [4 /*yield*/, migrateSectionDescriptions()
                        // Migrate lessons
                    ];
                case 3:
                    // Migrate sections
                    _b.sectionsUpdated = _d.sent();
                    // Migrate lessons
                    _c = stats;
                    return [4 /*yield*/, migrateLessonContent()];
                case 4:
                    // Migrate lessons
                    _c.lessonsUpdated = _d.sent();
                    console.log('\n🎉 Migration completed successfully!');
                    console.log('📊 Final Stats:');
                    console.log("   - Courses updated: ".concat(stats.coursesUpdated));
                    console.log("   - Sections updated: ".concat(stats.sectionsUpdated));
                    console.log("   - Lessons updated: ".concat(stats.lessonsUpdated));
                    return [3 /*break*/, 8];
                case 5:
                    error_4 = _d.sent();
                    console.error('💥 Migration failed:', error_4);
                    stats.errors.push(error_4 instanceof Error ? error_4.message : String(error_4));
                    return [3 /*break*/, 8];
                case 6: return [4 /*yield*/, prisma.$disconnect()];
                case 7:
                    _d.sent();
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/, stats];
            }
        });
    });
}
/**
 * Dry run - analyze content without making changes
 */
function analyzeMigrationNeeds() {
    return __awaiter(this, void 0, void 0, function () {
        var coursesNeedingMigration, sectionsNeedingMigration, lessonsNeedingMigration, total;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🔍 Analyzing content migration needs...');
                    return [4 /*yield*/, prisma.course.count({
                            where: {
                                OR: [
                                    {
                                        description: {
                                            not: null,
                                            notIn: ['', '{"type":"doc","content":[]}']
                                        }
                                    },
                                    {
                                        shortDescription: {
                                            not: null,
                                            notIn: ['', '{"type":"doc","content":[]}']
                                        }
                                    }
                                ]
                            }
                        })];
                case 1:
                    coursesNeedingMigration = _a.sent();
                    return [4 /*yield*/, prisma.courseSection.count({
                            where: {
                                description: {
                                    not: null,
                                    notIn: ['', '{"type":"doc","content":[]}']
                                }
                            }
                        })];
                case 2:
                    sectionsNeedingMigration = _a.sent();
                    return [4 /*yield*/, prisma.lesson.count({
                            where: {
                                OR: [
                                    {
                                        content: {
                                            not: null,
                                            notIn: ['', '{"type":"doc","content":[]}']
                                        }
                                    },
                                    {
                                        description: {
                                            not: null,
                                            notIn: ['', '{"type":"doc","content":[]}']
                                        }
                                    }
                                ]
                            }
                        })];
                case 3:
                    lessonsNeedingMigration = _a.sent();
                    total = coursesNeedingMigration + sectionsNeedingMigration + lessonsNeedingMigration;
                    console.log('📊 Analysis Results:');
                    console.log("   - Courses needing migration: ".concat(coursesNeedingMigration));
                    console.log("   - Sections needing migration: ".concat(sectionsNeedingMigration));
                    console.log("   - Lessons needing migration: ".concat(lessonsNeedingMigration));
                    console.log("   - Total items: ".concat(total));
                    return [4 /*yield*/, prisma.$disconnect()];
                case 4:
                    _a.sent();
                    return [2 /*return*/, {
                            courses: coursesNeedingMigration,
                            sections: sectionsNeedingMigration,
                            lessons: lessonsNeedingMigration,
                            totalItems: total
                        }];
            }
        });
    });
}
/**
 * Helper function to detect if content is likely markdown
 */
function isLikelyMarkdown(content) {
    if (!content)
        return false;
    var markdownIndicators = [
        /^#{1,6}\s/m, // Headers
        /^\*\s/m, // Bullet points with *
        /^-\s/m, // Bullet points with -
        /^\d+\.\s/m, // Numbered lists
        /\*\*.*\*\*/, // Bold text
        /\*.*\*/, // Italic text
        /\[.*\]\(.*\)/, // Links
    ];
    return markdownIndicators.some(function (pattern) { return pattern.test(content); });
}
// CLI Usage Example
if (require.main === module) {
    var command = process.argv[2];
    switch (command) {
        case 'analyze':
            analyzeMigrationNeeds();
            break;
        case 'migrate':
            runFullMigration();
            break;
        case 'courses':
            migrateCourseDescriptions();
            break;
        case 'sections':
            migrateSectionDescriptions();
            break;
        case 'lessons':
            migrateLessonContent();
            break;
        default:
            console.log('Usage:');
            console.log('  npm run migrate analyze   - Analyze migration needs');
            console.log('  npm run migrate migrate   - Run full migration');
            console.log('  npm run migrate courses   - Migrate only courses');
            console.log('  npm run migrate sections  - Migrate only sections');
            console.log('  npm run migrate lessons   - Migrate only lessons');
    }
}
