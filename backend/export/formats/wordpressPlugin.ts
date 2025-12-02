/**
 * WordPress Plugin Generator
 * 
 * Generates a WordPress plugin ZIP file containing:
 * - Main plugin PHP file with shortcode and widget
 * - Admin settings page
 * - API integration
 */

import { AgentDefinition } from '../../db/types'
import { ExportResult } from '../agentExporter'

export interface WordPressPluginFiles {
  [path: string]: string
}

export async function exportAsWordPressPlugin(
  agent: AgentDefinition,
  apiUrl: string
): Promise<ExportResult> {
  const pluginSlug = `zwartify-${agent.id.replace(/-/g, '')}`
  const pluginName = `Zwartify ${agent.name}`
  
  // Generate all plugin files
  const files: WordPressPluginFiles = {
    [`${pluginSlug}.php`]: generateMainPluginFile(agent, apiUrl, pluginSlug, pluginName),
    [`includes/widget.php`]: generateWidgetFile(agent, apiUrl, pluginSlug),
    [`includes/admin.php`]: generateAdminFile(agent, apiUrl, pluginSlug),
    [`readme.txt`]: generateReadme(agent, pluginSlug),
  }
  
  // Return files as JSON (ZIP creation will be handled in API route)
  return {
    format: 'wordpress',
    content: JSON.stringify(files, null, 2),
    mimeType: 'application/json',
    filename: `${pluginSlug}.json`,
    embedCode: `[zwartify_agent id="${agent.id}"]`,
    installInstructions: `1. Download and extract the ZIP file
2. Upload the ${pluginSlug} folder to /wp-content/plugins/
3. Activate the plugin in WordPress Admin
4. Use shortcode: [zwartify_agent id="${agent.id}"]`
  }
}

function generateMainPluginFile(
  agent: AgentDefinition,
  apiUrl: string,
  pluginSlug: string,
  pluginName: string
): string {
  return `<?php
/**
 * Plugin Name: ${pluginName}
 * Plugin URI: https://zwartify.com
 * Description: ${agent.description || 'Zwartify AI Agent'}
 * Version: ${agent.version || '1.0.0'}
 * Author: Zwartify
 * Author URI: https://zwartify.com
 * License: GPL v2 or later
 * Text Domain: ${pluginSlug}
 */

if (!defined('ABSPATH')) {
    exit;
}

define('ZWARTIFY_AGENT_ID', '${agent.id}');
define('ZWARTIFY_API_URL', '${apiUrl}');

// Include widget and admin files
require_once plugin_dir_path(__FILE__) . 'includes/widget.php';
require_once plugin_dir_path(__FILE__) . 'includes/admin.php';

// Register shortcode
add_shortcode('zwartify_agent', 'zwartify_agent_shortcode');

function zwartify_agent_shortcode($atts) {
    $atts = shortcode_atts(array(
        'id' => ZWARTIFY_AGENT_ID,
        'width' => '100%',
        'height' => '600px',
    ), $atts);
    
    $widget_id = 'zwartify-' . uniqid();
    
    ob_start();
    ?>
    <div id="<?php echo esc_attr($widget_id); ?>" 
         class="zwartify-agent-widget" 
         style="width: <?php echo esc_attr($atts['width']); ?>; height: <?php echo esc_attr($atts['height']); ?>;">
        <div class="zwartify-loading">Loading agent...</div>
    </div>
    <script>
        (function() {
            const widgetId = '<?php echo esc_js($widget_id); ?>';
            const agentId = '<?php echo esc_js($atts['id']); ?>';
            const apiUrl = '<?php echo esc_js(ZWARTIFY_API_URL); ?>';
            
            // Load widget script
            const script = document.createElement('script');
            script.src = apiUrl + '/widget.js';
            script.onload = function() {
                if (window.ZwartifyWidget) {
                    window.ZwartifyWidget.init({
                        agentId: agentId,
                        containerId: widgetId
                    });
                }
            };
            document.head.appendChild(script);
        })();
    </script>
    <?php
    return ob_get_clean();
}

// Enqueue styles
add_action('wp_enqueue_scripts', function() {
    wp_add_inline_style('wp-block-library', '
        .zwartify-agent-widget {
            border: 1px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
        }
        .zwartify-loading {
            padding: 20px;
            text-align: center;
            color: #666;
        }
    ');
});
`
}

function generateWidgetFile(
  agent: AgentDefinition,
  apiUrl: string,
  pluginSlug: string
): string {
  return `<?php
/**
 * Widget Class
 */

if (!defined('ABSPATH')) {
    exit;
}

class Zwartify_Agent_Widget extends WP_Widget {
    
    public function __construct() {
        parent::__construct(
            'zwartify_agent_widget',
            'Zwartify Agent',
            array('description' => 'Display a Zwartify AI Agent')
        );
    }
    
    public function widget($args, $instance) {
        echo $args['before_widget'];
        
        if (!empty($instance['title'])) {
            echo $args['before_title'] . apply_filters('widget_title', $instance['title']) . $args['after_title'];
        }
        
        $agent_id = !empty($instance['agent_id']) ? $instance['agent_id'] : '${agent.id}';
        echo do_shortcode('[zwartify_agent id="' . esc_attr($agent_id) . '"]');
        
        echo $args['after_widget'];
    }
    
    public function form($instance) {
        $title = !empty($instance['title']) ? $instance['title'] : '';
        $agent_id = !empty($instance['agent_id']) ? $instance['agent_id'] : '${agent.id}';
        ?>
        <p>
            <label for="<?php echo esc_attr($this->get_field_id('title')); ?>">Title:</label>
            <input class="widefat" id="<?php echo esc_attr($this->get_field_id('title')); ?>" 
                   name="<?php echo esc_attr($this->get_field_name('title')); ?>" 
                   type="text" value="<?php echo esc_attr($title); ?>">
        </p>
        <p>
            <label for="<?php echo esc_attr($this->get_field_id('agent_id')); ?>">Agent ID:</label>
            <input class="widefat" id="<?php echo esc_attr($this->get_field_id('agent_id')); ?>" 
                   name="<?php echo esc_attr($this->get_field_name('agent_id')); ?>" 
                   type="text" value="<?php echo esc_attr($agent_id); ?>">
        </p>
        <?php
    }
    
    public function update($new_instance, $old_instance) {
        $instance = array();
        $instance['title'] = (!empty($new_instance['title'])) ? strip_tags($new_instance['title']) : '';
        $instance['agent_id'] = (!empty($new_instance['agent_id'])) ? strip_tags($new_instance['agent_id']) : '${agent.id}';
        return $instance;
    }
}

add_action('widgets_init', function() {
    register_widget('Zwartify_Agent_Widget');
});
`
}

function generateAdminFile(
  agent: AgentDefinition,
  apiUrl: string,
  pluginSlug: string
): string {
  return `<?php
/**
 * Admin Settings Page
 */

if (!defined('ABSPATH')) {
    exit;
}

add_action('admin_menu', function() {
    add_options_page(
        'Zwartify Agent Settings',
        'Zwartify Agent',
        'manage_options',
        '${pluginSlug}',
        'zwartify_agent_admin_page'
    );
});

function zwartify_agent_admin_page() {
    if (!current_user_can('manage_options')) {
        return;
    }
    
    if (isset($_POST['zwartify_save_settings'])) {
        check_admin_referer('zwartify_settings');
        update_option('zwartify_api_url', sanitize_text_field($_POST['api_url']));
        echo '<div class="notice notice-success"><p>Settings saved!</p></div>';
    }
    
    $api_url = get_option('zwartify_api_url', '${apiUrl}');
    ?>
    <div class="wrap">
        <h1>Zwartify Agent Settings</h1>
        <form method="post">
            <?php wp_nonce_field('zwartify_settings'); ?>
            <table class="form-table">
                <tr>
                    <th scope="row">
                        <label for="api_url">API URL</label>
                    </th>
                    <td>
                        <input type="url" id="api_url" name="api_url" 
                               value="<?php echo esc_attr($api_url); ?>" 
                               class="regular-text" />
                        <p class="description">The base URL for the Zwartify API</p>
                    </td>
                </tr>
            </table>
            <?php submit_button('Save Settings', 'primary', 'zwartify_save_settings'); ?>
        </form>
        
        <h2>Usage</h2>
        <p>Use the shortcode in any post or page:</p>
        <code>[zwartify_agent id="${agent.id}"]</code>
        <p>Or add the widget from <a href="<?php echo admin_url('widgets.php'); ?>">Appearance → Widgets</a></p>
    </div>
    <?php
}
`
}

function generateReadme(agent: AgentDefinition, pluginSlug: string): string {
  return `=== ${agent.name} ===
Contributors: zwartify
Tags: ai, chatbot, agent, assistant
Requires at least: 5.0
Tested up to: 6.4
Stable tag: ${agent.version || '1.0.0'}
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

${agent.description || 'Zwartify AI Agent for WordPress'}

== Description ==

${agent.description || 'A powerful AI agent powered by ZwartifyOS'}

== Installation ==

1. Upload the plugin files to the /wp-content/plugins/${pluginSlug} directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Use the shortcode [zwartify_agent] in any post or page
4. Or add the widget from Appearance → Widgets

== Frequently Asked Questions ==

= How do I use this agent? =

Use the shortcode [zwartify_agent] in any post or page, or add the widget to your sidebar.

== Changelog ==

= ${agent.version || '1.0.0'} =
* Initial release
`
}

