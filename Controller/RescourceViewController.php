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

        /**
        *   Assignee - ID first ; idle - less work first
        */
        /*get user list first*/
        $members = $this->projectUserRoleModel->getAssignableUsers($project['id']);
        //$members = $this->projectUserRoleModel->getAssignableUsersList($project['id'], true, false, false);

        $memblist = array();
        foreach ($members as $id => $name) {
            $memblist[$name] = 0;
        }

        /*get task data*/
        $filter = $this->taskLexer->build($search)->withFilter(new TaskProjectFilter($project['id']));
        
        $filter->getQuery()->asc(TaskModel::TABLE.'.owner_id')->asc(TaskModel::TABLE.'.date_due');

        $tasklist = $filter->format($this->RescourceViewFormatter);

        /*count assignee's tasks*/
        foreach ($tasklist as $task) {
            if(!empty($task['assignee'])){
                $memblist[$task['assignee']]++;
            }
        }

        $this->response->html($this->helper->layout->app('RescourceView:res_view/show', array(
            'project' => $project,
            'title' => $project['name'],
            'description' => $this->helper->projectHeader->getDescription($project),
            'sorting' => $sorting,
            'members' => $memblist,
            'tasks' => $tasklist,
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
