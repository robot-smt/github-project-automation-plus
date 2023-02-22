/**
 * GraphQl query to get project and column information
 *
 * @param {string} url - Issue or Pull request url
 * @param {string} eventName - The current event name
 * @param {string} project - The project to find
 */
const projectQuery = (url, eventName, project) =>
	`query {
		resource( url: "${url}" ) {
			... on ${eventName.startsWith('issue') ? 'Issue' : 'PullRequest'} {
				number
				title
      			titleHTML
				projectCards {
					nodes {
						id
						isArchived
						column {
							id
							name
							databaseId
						}
						project {
							name
							id
						}
					}
				}
				repository {
					projects( search: "${project}", first: 10, states: [OPEN] ) {
						nodes {
							name
							id
							columns( first: 100 ) {
								nodes {
									id
									name
								}
							}
						}
					}
					owner {
						... on ProjectOwner {
							projects( search: "${project}", first: 10, states: [OPEN] ) {
								nodes {
									name
									id
									columns( first: 100 ) {
										nodes {
											id
											name
										}
									}
								}
							}
						}
					}
				}
			}
		}
	}`;

module.exports = projectQuery;
