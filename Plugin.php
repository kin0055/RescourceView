<?php

namespace Kanboard\Plugin\RescourceView;

use Kanboard\Core\Plugin\Base;
use Kanboard\Core\Security\Role;
use Kanboard\Core\Translator;

use Kanboard\Plugin\RescourceView\Formatter\RescourceViewFormatter;

class Plugin extends Base
{
    public function initialize()
    {
        $this->route->addRoute('RescourceView/:project_id', 'RescourceViewController', 'show', 'plugin');
        $this->route->addRoute('RescourceView/:project_id/sort/:sorting', 'RescourceViewController', 'show', 'plugin');

        $this->template->hook->attach('template:project-header:view-switcher', 'RescourceView:project_header/views');
        $this->template->hook->attach('template:project:dropdown', 'RescourceView:project/dropdown');

        $this->hook->on('template:layout:js', array('template' => 'plugins/RescourceView/Assets/Reschart.js'));
        $this->hook->on('template:layout:js', array('template' => 'plugins/RescourceView/Assets/Rescource.js'));
        $this->hook->on('template:layout:css', array('template' => 'plugins/RescourceView/Assets/gantt.css'));

        $this->container['RescourceViewFormatter'] = $this->container->factory(function ($c) {
            return new RescourceViewFormatter($c);
        });
    }

    public function onStartup()
    {
        Translator::load($this->languageModel->getCurrentLanguage(), __DIR__.'/Locale');
    }

    public function getPluginName()
    {
        return 'RescourceView';
    }

    public function getPluginDescription()
    {
        return t('Project Rescource View for Kanboard');
    }

    public function getPluginAuthor()
    {
        return 'Kin';
    }

    public function getPluginVersion()
    {
        return '0.0.4';
    }

    public function getPluginHomepage()
    {
        return 'N/A';
    }

    public function getCompatibleVersion()
    {
        return '>1.2.3';
    }
}
