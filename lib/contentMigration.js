"use strict";
/**
 * Content Migration Utility for TipTap Implementation
 *
 * This script helps convert existing plain text content to TipTap JSON format
 * for courses, sections, and lessons.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrationQueries = void 0;
exports.convertPlainTextToTipTap = convertPlainTextToTipTap;
exports.convertMarkdownToTipTap = convertMarkdownToTipTap;
exports.extractTextFromTipTap = extractTextFromTipTap;
exports.isTipTapContent = isTipTapContent;
/**
 * Convert plain text to TipTap JSON format
 */
function convertPlainTextToTipTap(text) {
    if (!text || text.trim() === '') {
        return JSON.stringify({
            type: "doc",
            content: []
        });
    }
    // Split text into paragraphs
    var paragraphs = text.split('\n\n').filter(function (p) { return p.trim() !== ''; });
    var content = paragraphs.map(function (paragraph) {
        var lines = paragraph.split('\n').filter(function (line) { return line.trim() !== ''; });
        if (lines.length === 1) {
            // Single line paragraph
            return {
                type: "paragraph",
                content: [
                    {
                        type: "text",
                        text: lines[0].trim()
                    }
                ]
            };
        }
        else {
            // Multi-line paragraph with breaks
            var lineNodes_1 = [];
            lines.forEach(function (line, index) {
                lineNodes_1.push({
                    type: "text",
                    text: line.trim()
                });
                if (index < lines.length - 1) {
                    lineNodes_1.push({
                        type: "hardBreak"
                    });
                }
            });
            return {
                type: "paragraph",
                content: lineNodes_1
            };
        }
    });
    var document = {
        type: "doc",
        content: content
    };
    return JSON.stringify(document);
}
/**
 * Convert Markdown-like text to TipTap JSON format
 */
function convertMarkdownToTipTap(text) {
    if (!text || text.trim() === '') {
        return JSON.stringify({
            type: "doc",
            content: []
        });
    }
    var lines = text.split('\n');
    var content = [];
    var currentParagraph = [];
    var _loop_1 = function (line) {
        var trimmedLine = line.trim();
        if (trimmedLine === '') {
            // Empty line - end current paragraph if it exists
            if (currentParagraph.length > 0) {
                content.push({
                    type: "paragraph",
                    content: currentParagraph
                });
                currentParagraph = [];
            }
            return "continue";
        }
        // Check for headers
        if (trimmedLine.startsWith('# ')) {
            if (currentParagraph.length > 0) {
                content.push({
                    type: "paragraph",
                    content: currentParagraph
                });
                currentParagraph = [];
            }
            content.push({
                type: "heading",
                attrs: { level: 1 },
                content: [{ type: "text", text: trimmedLine.substring(2) }]
            });
        }
        else if (trimmedLine.startsWith('## ')) {
            if (currentParagraph.length > 0) {
                content.push({
                    type: "paragraph",
                    content: currentParagraph
                });
                currentParagraph = [];
            }
            content.push({
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: trimmedLine.substring(3) }]
            });
        }
        else if (trimmedLine.startsWith('### ')) {
            if (currentParagraph.length > 0) {
                content.push({
                    type: "paragraph",
                    content: currentParagraph
                });
                currentParagraph = [];
            }
            content.push({
                type: "heading",
                attrs: { level: 3 },
                content: [{ type: "text", text: trimmedLine.substring(4) }]
            });
        }
        else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
            // Bullet list item
            if (currentParagraph.length > 0) {
                content.push({
                    type: "paragraph",
                    content: currentParagraph
                });
                currentParagraph = [];
            }
            // Check if last item is a bullet list
            var lastItem = content[content.length - 1];
            if (lastItem && lastItem.type === "bulletList") {
                lastItem.content.push({
                    type: "listItem",
                    content: [{
                            type: "paragraph",
                            content: [{ type: "text", text: trimmedLine.substring(2) }]
                        }]
                });
            }
            else {
                content.push({
                    type: "bulletList",
                    content: [{
                            type: "listItem",
                            content: [{
                                    type: "paragraph",
                                    content: [{ type: "text", text: trimmedLine.substring(2) }]
                                }]
                        }]
                });
            }
        }
        else if (/^\d+\.\s/.test(trimmedLine)) {
            // Numbered list item
            if (currentParagraph.length > 0) {
                content.push({
                    type: "paragraph",
                    content: currentParagraph
                });
                currentParagraph = [];
            }
            var lastItem = content[content.length - 1];
            var text_1 = trimmedLine.replace(/^\d+\.\s/, '');
            if (lastItem && lastItem.type === "orderedList") {
                lastItem.content.push({
                    type: "listItem",
                    content: [{
                            type: "paragraph",
                            content: [{ type: "text", text: text_1 }]
                        }]
                });
            }
            else {
                content.push({
                    type: "orderedList",
                    content: [{
                            type: "listItem",
                            content: [{
                                    type: "paragraph",
                                    content: [{ type: "text", text: text_1 }]
                                }]
                        }]
                });
            }
        }
        else {
            // Regular text line
            if (currentParagraph.length > 0) {
                currentParagraph.push({ type: "hardBreak" });
            }
            // Handle bold and italic formatting
            var textContent = trimmedLine;
            var textNode = { type: "text", text: textContent };
            // Simple bold detection
            if (textContent.includes('**')) {
                var parts = textContent.split('**');
                var formattedContent_1 = [];
                parts.forEach(function (part, index) {
                    if (index % 2 === 0) {
                        if (part)
                            formattedContent_1.push({ type: "text", text: part });
                    }
                    else {
                        if (part)
                            formattedContent_1.push({
                                type: "text",
                                text: part,
                                marks: [{ type: "bold" }]
                            });
                    }
                });
                currentParagraph.push.apply(currentParagraph, formattedContent_1);
            }
            else {
                currentParagraph.push(textNode);
            }
        }
    };
    for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
        var line = lines_1[_i];
        _loop_1(line);
    }
    // Add remaining paragraph
    if (currentParagraph.length > 0) {
        content.push({
            type: "paragraph",
            content: currentParagraph
        });
    }
    var document = {
        type: "doc",
        content: content
    };
    return JSON.stringify(document);
}
/**
 * Extract plain text from TipTap content for previews
 */
function extractTextFromTipTap(content) {
    if (!content)
        return "";
    try {
        var parsed = JSON.parse(content);
        function extractText(node) {
            if (node.type === 'text') {
                return node.text || '';
            }
            if (node.content) {
                return node.content.map(extractText).join('');
            }
            return '';
        }
        if (parsed.content) {
            return parsed.content.map(extractText).join(' ');
        }
        return '';
    }
    catch (e) {
        // Return as-is if not JSON
        return content;
    }
}
/**
 * Check if content is in TipTap JSON format
 */
function isTipTapContent(content) {
    if (!content)
        return false;
    try {
        var parsed = JSON.parse(content);
        return parsed.type === 'doc' && Array.isArray(parsed.content);
    }
    catch (e) {
        return false;
    }
}
/**
 * Database migration helpers
 */
exports.migrationQueries = {
    // Course descriptions
    migrateCoursesDescriptions: "\n    UPDATE \"Course\" \n    SET description = $1 \n    WHERE id = $2 AND description IS NOT NULL AND description != ''\n  ",
    // Section descriptions  
    migrateSectionsDescriptions: "\n    UPDATE \"Section\" \n    SET description = $1 \n    WHERE id = $2 AND description IS NOT NULL AND description != ''\n  ",
    // Lesson content and descriptions
    migrateLessonsContent: "\n    UPDATE \"Lesson\" \n    SET content = $1, description = $2 \n    WHERE id = $3 AND (content IS NOT NULL OR description IS NOT NULL)\n  ",
    // Get all courses with plain text descriptions
    getCoursesWithPlainText: "\n    SELECT id, description, \"shortDescription\" \n    FROM \"Course\" \n    WHERE description IS NOT NULL AND description != ''\n  ",
    // Get all sections with plain text descriptions
    getSectionsWithPlainText: "\n    SELECT id, description \n    FROM \"Section\" \n    WHERE description IS NOT NULL AND description != ''\n  ",
    // Get all lessons with plain text content
    getLessonsWithPlainText: "\n    SELECT id, content, description \n    FROM \"Lesson\" \n    WHERE content IS NOT NULL OR description IS NOT NULL\n  "
};
/**
 * Example usage for migration:
 *
 * import { convertPlainTextToTipTap, convertMarkdownToTipTap } from './contentMigration'
 *
 * // For plain text
 * const tiptapContent = convertPlainTextToTipTap("This is a paragraph.\n\nThis is another paragraph.")
 *
 * // For markdown-like content
 * const markdownContent = `
 * # Course Overview
 *
 * This course will teach you:
 * - JavaScript fundamentals
 * - React basics
 * - Advanced patterns
 *
 * ## Prerequisites
 * Basic HTML knowledge
 * `
 * const tiptapFromMarkdown = convertMarkdownToTipTap(markdownContent)
 */
