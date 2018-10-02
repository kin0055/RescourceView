<section id="main">
    <?= $this->projectHeader->render($project, 'RescourceViewController', 'show', false, 'RescourceView') ?>
    <div class="menu-inline">
        <ul>
            <li <?= $sorting === 'Assignee' ? 'class="active"' : '' ?>>
                <?= $this->url->icon('sort-numeric-asc', t('Sort by Assignee'), 'RescourceViewController', 'show', array('project_id' => $project['id'], 'sorting' => 'Assignee', 'plugin' => 'RescourceView')) ?>
            </li>
            <li <?= $sorting === 'idle' ? 'class="active"' : '' ?>>
                <?= $this->url->icon('sort-amount-asc', t('Sort by idle-status'), 'RescourceViewController', 'show', array('project_id' => $project['id'], 'sorting' => 'idle', 'plugin' => 'RescourceView')) ?>
            </li>
        </ul>
    </div>

    <?php if (! empty($tasks)): ?>
        <div
            id="rescource-chart"
            data-records='<?= json_encode($tasks, JSON_HEX_APOS) ?>'
            data-save-url="<?= $this->url->href('RescourceViewController', 'save', array('project_id' => $project['id'], 'plugin' => 'RescourceView')) ?>"
            data-label-start-date="<?= t('Start date:') ?>"
            data-label-end-date="<?= t('Due date:') ?>"
            data-label-assignee="<?= t('Assignee:') ?>"
            data-label-not-defined="<?= t('There is no start date or due date for this task.') ?>"
        ></div>
        <p class="alert alert-info"><?= t('Moving or resizing a task will change the start and due date of the task.') ?></p>
    <?php else: ?>
        <p class="alert"><?= t('There is no task in your project.') ?></p>
    <?php endif ?>
</section>
