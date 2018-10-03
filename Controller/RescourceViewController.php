<?php

namespace Kanboard\Plugin\RescourceView\Controller;

use Kanboard\Controller\BaseController;
use Kanboard\Filter\TaskProjectFilter;
use Kanboard\Model\TaskModel;

/**
 * Tasks RescourceView Controller
 *
 * @package  Kanboard\Controller
 * @author   Frederic Guillot
 * @property \Kanboard\Plugin\RescourceView\Formatter\RescourceViewFormatter $RescourceViewFormatter
 */
class RescourceViewController extends BaseController
{
    /**
     * Show RescourceView chart for one project
     */
    public function show()
    {
        $project = $this->getProject();
        $search = $this->helper->projectHeader->getSearchQuery($project);
        $sorting = $this->request->getStringParam('sorting', '');
        $filter = $this->taskLexer->build($search)->withFilter(new TaskProjectFilter($project['id']));

        /**
        *   Assignee - ID first ; idle - less work first
        */
        if ($sorting === 'Assignee') {
            $filter->getQuery()->asc(TaskModel::TABLE.'.date_started')->asc(TaskModel::TABLE.'.date_creation');
        } else {
            $filter->getQuery()->asc('column_position')->asc(TaskModel::TABLE.'.position');
        }

        $this->response->html($this->helper->layout->app('RescourceView:res_view/show', array(
            'project' => $project,
            'title' => $project['name'],
            'description' => $this->helper->projectHeader->getDescription($project),
            'sorting' => $sorting,
            'tasks' => $filter->format($this->RescourceViewFormatter),
        )));
    }

    /**
     * Save new task start date and due date
     */
    public function save()
    {
        $this->getProject();
        $changes = $this->request->getJson();
        $values = [];

        if (! empty($changes['start'])) {
            $values['date_started'] = strtotime($changes['start']);
        }

        if (! empty($changes['end'])) {
            $values['date_due'] = strtotime($changes['end']);
        }

        if (! empty($values)) {
            $values['id'] = $changes['id'];
            $result = $this->taskModificationModel->update($values);

            if (! $result) {
                $this->response->json(array('message' => 'Unable to save task'), 400);
            } else {
                $this->response->json(array('message' => 'OK'), 201);
            }
        } else {
            $this->response->json(array('message' => 'Ignored'), 200);
        }
    }
}
