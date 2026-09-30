-- LOCAL TEST_FIXTURE / DEV-ONLY. Never apply this seed to the remote App project.
insert into content.content_release (id, release_key, version, status)
values ('60000000-0000-0000-0000-000000000001', 'dev-local-only-first-slice', 1, 'draft');

insert into content.content_node_version (
  id,
  release_id,
  node_key,
  node_type,
  engine_code,
  engine_version,
  payload,
  content_hash
)
values (
  '60000000-0000-0000-0000-000000000002',
  '60000000-0000-0000-0000-000000000001',
  'alphabet-missing-letters',
  'activity',
  'E02',
  '1.0.0-dev',
  jsonb_build_object(
    'activityId', 'alphabet-missing-letters',
    'activityVersion', '1.0.0-dev',
    'contentReleaseId', '60000000-0000-0000-0000-000000000001',
    'engineType', 'E02_DRAG_DROP',
    'engineVersion', '1.0.0-dev',
    'instructionAudioAssetId', 'voice-instruction',
    'instructionVisualAssetIds', jsonb_build_array('missing-letters-scene', 'alphabet-glyph-master'),
    'orderedSequenceId', 'approved-alphabet-sequence-v1',
    'visibleSequence', jsonb_build_array('glyph-01', 'glyph-02', 'glyph-03', 'glyph-04', 'glyph-05', 'glyph-06'),
    'missingPositions', jsonb_build_array(1, 3, 5),
    'missingCount', 3,
    'trayItems', jsonb_build_array(
      jsonb_build_object('id', 'item-02', 'glyph', 'glyph-02', 'accessibilityLabel', 'Lựa chọn chữ 1'),
      jsonb_build_object('id', 'item-04', 'glyph', 'glyph-04', 'accessibilityLabel', 'Lựa chọn chữ 2'),
      jsonb_build_object('id', 'item-06', 'glyph', 'glyph-06', 'accessibilityLabel', 'Lựa chọn chữ 3')
    ),
    'trayShuffleSeed', 'dev-round-seed-a',
    'dropTargets', jsonb_build_array(
      jsonb_build_object('id', 'target-1', 'position', 1, 'expectedTrayItemId', 'item-02', 'accessibilityLabel', 'Ô trống 1'),
      jsonb_build_object('id', 'target-3', 'position', 3, 'expectedTrayItemId', 'item-04', 'accessibilityLabel', 'Ô trống 2'),
      jsonb_build_object('id', 'target-5', 'position', 5, 'expectedTrayItemId', 'item-06', 'accessibilityLabel', 'Ô trống 3')
    ),
    'refreshableRoundConfig', jsonb_build_object('alternativeMissingPositionSets', jsonb_build_array(jsonb_build_array(0, 2, 4))),
    'feedback', jsonb_build_object(
      'correctAudioAssetId', 'voice-feedback',
      'retryAudioAssetId', 'voice-feedback',
      'hintAudioAssetId', 'voice-feedback',
      'completionAudioAssetId', 'voice-feedback'
    ),
    'accessibility', jsonb_build_object('nonDragAlternative', 'select_then_place', 'instructionLabel', 'Đặt từng chữ vào ô trống'),
    'requiresFull', false,
    'completionRuleId', 'round-complete-v1',
    'educationApprovalVersion', 'APP-EDU-06'
  ),
  'dev-local-only-first-slice-hash-v1'
);

update content.content_release
set status = 'published'
where id = '60000000-0000-0000-0000-000000000001';
