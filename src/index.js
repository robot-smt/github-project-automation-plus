const core = require('@actions/core')
const github = require('@actions/github')

const getActionData = require('./get-action-data')
const generateProjectQuery = require('./generate-project-query')
const generateMutationQuery = require('./generate-mutation-query')

;(async () => {
    try {
        const token = core.getInput('repo-token')
        const project = core.getInput('project')
        const column = core.getInput('column')
        const fromColumns = (core.getInput('from-column') || '').split(',').filter((x) => x)
        const action = core.getInput('action') || 'update'
        const issueIds = (core.getInput('issue-ids') || '').split(',').filter((x) => x)
        const dryRun = core.getInput('dryRun') || 'false'

        // Create a method to query GitHub
        const octokit = new github.GitHub(token)

        const updatedCards = []

        core.debug(`Issue ids: ${issueIds}`)

        for (const actionData of getActionData(github.context, issueIds)) {
            // Get data from the current action
            const { eventName, nodeId, url } = actionData

            // Get the column ID from searching for the project and card Id if it exists
            const projectQuery = generateProjectQuery(url, eventName, project)

            core.debug(projectQuery)

            const { resource } = await octokit.graphql(projectQuery)

            core.debug(JSON.stringify(resource))

            if (!resource) {
                console.log(`Card ${url} cannot be found in ${project}`)
                continue
            }

            updatedCards.push({
                number: resource.number,
                title: resource.title,
                url,
                status: 'Success'
            })

            if (dryRun === 'true') {
                continue
            }

            const currentActualColumn = resource.projectCards.nodes.map((x) => x.column?.name).filter((x) => x)?.[0]
            // A list of columns that line up with the user entered project and column
            const mutationQueries = generateMutationQuery(resource, project, column, nodeId || resource.nodeId, action)
            if (
                ((action === 'delete' || action === 'archive' || action === 'add') && mutationQueries.length === 0) ||
                (fromColumns.length && !fromColumns.includes(currentActualColumn))
            ) {
                console.log('✅ There is nothing to do with card')
                return
            }

            core.debug(mutationQueries.join('\n'))

            try {
                // Run the graphql queries
                await Promise.all(mutationQueries.map((query) => octokit.graphql(query)))

                if (mutationQueries.length > 1) {
                    console.log(`✅ Card materialised into to ${column} in ${mutationQueries.length} projects called ${project}`)
                } else {
                    console.log(`✅ Card materialised into ${column} in ${project}`)
                }
            } catch {
                updatedCards[updatedCards.length - 1].status = 'Failure'
            }
        }

        core.setOutput('updatedCardsCount', updatedCards.filter((x) => x.status === 'Success').length)

        if (issueIds.filter((x) => x).length && updatedCards.length) {
            core.debug(JSON.stringify(updatedCards))

            const summaryMarkdown = `# Affected project cards
|ID|Title|Status|
|---|---|---|
${updatedCards.map((x) => `|${x.number}|[${x.title}](${x.url})|${x.status}|`).join('\r\n')}`
            core.setOutput('summaryMarkdown', summaryMarkdown)
        }
    } catch (error) {
        core.setFailed(error.message)
    }
})()
