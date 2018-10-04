<?php if ($this->user->hasProjectAccess('RescourceViewController', 'show', $project['id'])): ?><li <?= $this->app->checkMenuSelection('RescourceViewController') ?>>
<?= $this->url->icon('male', t('Rescource'), 'RescourceViewController', 'show', array('project_id' => $project['id'], 'search' => $filters['search'], 'plugin' => 'RescourceView'), false, 'view-Rescource', t('Keyboard shortcut: "%s"', 'v s')) ?>
</li><?php endif ?>
