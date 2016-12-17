const defaultState = {
  viewType: 'COMPONENT_DETAIL',
  viewProps: {
    id: '1',
  },
}

export default (state=defaultState, action) => {
  switch(action.type) {
    case 'SHOW_COMPONENT_DETAIL':
      return {
        viewType: 'COMPONENT_DETAIL',
        viewProps: {
          id: action.id
        },
      }
    default:
      return state
  }
}
