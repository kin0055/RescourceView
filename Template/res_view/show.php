<section id="main">
    <?= $this->projectHeader->render($project, 'RescourceViewController', 'show', false, 'RescourceView') ?>

    <?php if (! empty($tasks)): /*count($member) > 1*/ ?>
        <div
            id="rescource-chart"
            data-records='<?= json_encode($tasks, JSON_HEX_APOS) ?>'
            data-members='<?= json_encode($members, JSON_HEX_APOS) ?>'
            data-save-url="<?= $this->url->href('RescourceViewController', 'save', array('project_id' => $project['id'], 'plugin' => 'RescourceView')) ?>"
            data-label-start-date="<?= t('Start date:') ?>"
            data-label-end-date="<?= t('Due date:') ?>"
            data-label-assignee="<?= t('Assignee:') ?>"
            data-label-no-job="<?= t('No Active Tasks') ?>"
            data-label-not-defined="<?= t('There is no start date or due date for this task.') ?>"
        ></div>
        <p class="alert alert-info"><?= t('Moving or resizing a task will change the start and due date of the task.') ?></p>
    <?php else: ?>
        <p class="alert"><?= t('There is no other member in your project.') ?></p>
    <?php endif ?>
</section>
