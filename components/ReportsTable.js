import 'react-table/react-table.css'
import React from 'react'
import ReactTable from 'react-table'
import { withApollo } from 'react-apollo'
import { Image } from 'semantic-ui-react'
import { query } from 'components/queries/ReportsQuery'

class ReportsTable extends React.Component {
  state = { data: [], loading: false, pages: -1 }

  render () {
    const columns = [{
      Header: 'ID',
      accessor: 'id',
      filterable: false,
      Cell: row => (
        <a href={`/report/${row.original.server.id}/${row.value}`}>#{row.value}</a>)
    }, {
      Header: 'Reporter',
      accessor: 'actor',
      filterable: false,
      Cell: row => (
        <a href={`player/${row.value.id}`}>
          <Image src={`https://crafatar.com/avatars/${row.value.id}?size=26&overlay=true`} fluid avatar />
          {row.value.name}
        </a>)
    }, {
      Header: 'Reported',
      accessor: 'player',
      filterable: false,
      Cell: row => (
        <a href={`player/${row.value.id}`}>
          <Image src={`https://crafatar.com/avatars/${row.value.id}?size=26&overlay=true`} fluid avatar />
          {row.value.name}
        </a>)
    }, {
      Header: 'State', accessor: 'state.name', filterable: false
    }, {
      Header: 'Assigned',
      accessor: 'assignee',
      filterable: false,
      Cell: row => (
        row.value ? <a href={`player/${row.value.id}`}>
          <Image src={`https://crafatar.com/avatars/${row.value.id}?size=26&overlay=true`} fluid avatar />
          {row.value.name}
        </a> : null)
    }]

    const { data, loading, pages } = this.state

    return (
      <React.Fragment>
        <ReactTable
          data={data}
          loading={loading}
          columns={columns}
          pages={pages}
          manual
          minRows={0}
          showPageSizeOptions={false}
          showPageJump={false}
          onFetchData={(state) => {
            this.setState({ loading: true })

            const { filtered, pageSize, page } = state
            const variables = { limit: pageSize, offset: page * pageSize }

            if (filtered.length) {
              filtered.forEach(filter => {
                variables[filter.id] = filter.value
              })
            }

            this.props.client.query({ query, variables })
              .then(({ data }) => {
                this.setState({
                  data: data.listReports.reports,
                  pages: Math.ceil(data.listReports.total / pageSize),
                  loading: false
                })
              })
          }}
        />
      </React.Fragment>
    )
  }
}

export default withApollo(ReportsTable)
