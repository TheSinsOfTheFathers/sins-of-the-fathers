export default {
  name: 'poll',
  title: 'Poll',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Poll Title',
      type: 'string',
      description: 'The internal title for the poll (e.g. "Decision #01")'
    },
    {
      name: 'question',
      title: 'Question',
      type: 'string',
      description: 'The question that will be displayed to readers.'
    },
    {
      name: 'context',
      title: 'Context',
      type: 'text',
      description: 'Additional context or explanation for the decision.'
    },
    {
      name: 'options',
      title: 'Options',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'The voting options.'
    },
    {
      name: 'pollId',
      title: 'Poll ID',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      description: 'Unique ID for the poll. This will be used as the document ID in Firestore.'
    },
    {
      name: 'date',
      title: 'Publication Date',
      type: 'date',
      options: {
        dateFormat: 'YYYY-MM-DD',
      }
    }
  ]
}
