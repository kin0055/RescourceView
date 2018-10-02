<?php if ($this->user->hasProjectAccess('RescourceViewController', 'show', $project['id'])): ?>
    <li>
        <?= $this->url->icon('male', t('Rescource View'), 'RescourceViewController', 'show', array('project_id' => $project['id'], 'plugin' => 'RescourceView')) ?>
    </li>
<?php endif ?>