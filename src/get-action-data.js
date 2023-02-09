/**
 * Fetch the relevant data from GitHub
 *
 * @param {object} githubContext - The current issue or pull request data
 */
const ACCEPTED_EVENT_TYPES = new Set(['pull_request', 'pull_request_target', 'pull_request_review', 'issues', 'issue_comment'])

const getActionData = (githubContext) => {
    const { eventName, payload } = githubContext
    if (!ACCEPTED_EVENT_TYPES.has(eventName)) {
        throw new Error(`Only pull requests, reviews, issues, or comments allowed. Received:\n${eventName}`)
    }

    if (eventName === 'issues' || eventName === 'issue_comment') {
        return {
            eventName,
            action: payload.action,
            nodeId: payload.issue.node_id,
            url: payload.issue.html_url
        }
    }

    const issueId = payload.pull_request.head.ref
        .replace(/\D/g, ' ')
        .split(' ')
        .find((x) => x)
		
    return {
        eventName: 'issues',
        action: payload.action,
        nodeId: null,
        url: `${payload.repository.svn_url}/issues/${issueId}`
    }
}

module.exports = getActionData
