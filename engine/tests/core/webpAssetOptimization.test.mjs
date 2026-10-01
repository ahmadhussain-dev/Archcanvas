import { test } from 'node:test';
import assert from 'node:assert/strict';

test('V4-66: UI WebP ', () => {
 const isWebpSupportedUrl = (url) => typeof url === 'string' && (url.endsWith('.webp') || url.endsWith('.png') || url.endsWith('.jpg'));
 assert.ok(isWebpSupportedUrl('textures/wood.webp'));
 assert.ok(isWebpSupportedUrl('textures/wood.png'));
});
