const core = require('@actions/core')

/**
 * Fetch the relevant data from GitHub
 *
 * @param {object} githubContext - The current issue or pull request data
 */
const ACCEPTED_EVENT_TYPES = new Set(['pull_request', 'pull_request_target', 'pull_request_review', 'issues', 'issue_comment'])

const getActionData = (githubContext, issueIds) => {
    const { eventName, payload } = githubContext
    if (!ACCEPTED_EVENT_TYPES.has(eventName) && issueIds.length === 0) {
        throw new Error(`Only pull requests, reviews, issues, or comments allowed. Received:\n${eventName}`)
    }

    if (issueIds.length > 0) {
        core.debug('Issue ids length greater than 0')
        return issueIds.map((x) => ({
            eventName: 'issues',
            action: payload.action,
            nodeId: null,
            url: `${payload.repository.svn_url}/issues/${x}`
        }))
    }

    if (eventName === 'issues' || eventName === 'issue_comment') {
        core.debug('Triggered by issues')
        return [
            {
                eventName,
                action: payload.action,
                nodeId: payload.issue.node_id,
                url: payload.issue.html_url
            }
        ]
    }

    core.debug('Triggered by pull request')
    const issueId = payload.pull_request.head.ref
        .replace(/\D/g, ' ')
        .split(' ')
        .find((x) => x)

    return [
        {
            eventName: 'issues',
            action: payload.action,
            nodeId: null,
            url: `${payload.repository.svn_url}/issues/${issueId}`
        }
    ]
}

module.exports = getActionData
