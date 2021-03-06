export default {
  namespaced: true,
  state: {
    defaultLogFilter: [
      'app.rx',
      'packet_dropped',
      'tsch.add_cell',
      'tsch.delete_cell',
      'tsch.synced',
      'tsch.desynced',
      'secjoin.joined',
      'secjoin.unjoined',
      'rpl.churn'
    ],
    connectionStatus: 'disconnected',
    operationalStatus: null,
    defaultSettings: null,
    runningSettings: null,
    availableSFs: [],
    availableConnectivities: [],
    availableTraceFiles: [],
    gitInfo: null,
    crashReport: null
  },
  getters: {
    connectionStatus (state) { return state.connectionStatus },
    operationalStatus (state) { return state.operationalStatus },
    defaultSettings (state) { return state.defaultSettings },
    runningSettings (state) { return state.runningSettings },
    availableSFs (state) { return state.availableSFs },
    availableConnectivities (state) { return state.availableConnectivities },
    availableTraceFiles (state) { return state.availableTraceFiles },
    gitInfo (state) { return state.gitInfo },
    crashReport (state) { return state.crashReport }
  },
  mutations: {
    changeConnectionStatus (state, newStatus) {
      state.connectionStatus = newStatus
    },
    changeOperationalStatus (state, newStatus) {
      state.operationalStatus = newStatus
    },
    saveDefaultSettings (state, defaultSettings) {
      state.defaultSettings = defaultSettings
    },
    updateRunningSettings (state, newSettings) {
      state.runningSettings = Object.assign({}, newSettings)
    },
    setAvailableSFs (state, sfList) {
      state.availableSFs = sfList
    },
    setAvailableConnectivities (state, connList) {
      state.availableConnectivities = connList
    },
    setAvailableTraceFiles (state, sfList) {
      state.availableTraceFiles = sfList
    },
    setGitInfo (state, gitInfo) { state.gitInfo = gitInfo },
    setCrashReport (state, crashReport) { state.crashReport = crashReport }
  },
  actions: {
    disconnect ({ commit }) {
      commit('changeConnectionStatus', 'disconnected')
    },
    connect ({ commit }) {
      commit('changeConnectionStatus', 'connected')
    },
    ready ({ commit }) {
      commit('changeOperationalStatus', 'ready')
    },
    start ({ state, commit, dispatch }, eel) {
      dispatch('simulation/reset', null, { root: true })
      commit('changeOperationalStatus', 'running')
      eel.start(state.runningSettings, state.defaultLogFilter)((ret) => {
        if (ret.status === 'success') {
          // the simulation ends successfully
        } else if (ret.status === 'aborted') {
          // aborted
        } else if (ret.status === 'failure') {
          // simulator crashed
          commit('setCrashReport', ret)
        }
        dispatch('ready')
      })
    },
    pause ({ commit }, eel) {
      eel.pause()(() => {
        commit('changeOperationalStatus', 'paused')
      })
    },
    resume ({ commit }, eel) {
      eel.resume()(() => {
        commit('changeOperationalStatus', 'running')
      })
    },
    abort ({ commit, dispatch }, eel) {
      commit('changeOperationalStatus', 'aborted')
      eel.abort()(() => {
        dispatch('simulation/reset', null, { root: true })
        dispatch('ready')
      })
    },
    saveDefaultSettings ({ commit, dispatch }, defaultSettings) {
      commit('saveDefaultSettings', defaultSettings)
      let newSettings
      if (defaultSettings === null) {
        newSettings = null
      } else {
        newSettings = Object.assign({}, defaultSettings.regular)
        if (defaultSettings.regular.exec_randomSeed === 'random') {
          // pick an integer for the default seed
          newSettings.exec_randomSeed = Math.floor(Math.random() * 10000)
        }
        // copy the first items in combination settings to regular
        for (let key in defaultSettings.combination) {
          newSettings[key] = defaultSettings.combination[key][0]
        }
      }
      dispatch('updateRunningSettings', newSettings)
      dispatch('ready')
    },
    updateRunningSettings ({ commit }, newSettings) {
      commit('updateRunningSettings', newSettings)
    },
    setAvailableSFs ({ commit }, sfList) {
      commit('setAvailableSFs', sfList)
    },
    setAvailableConnectivities ({ commit }, connList) {
      commit('setAvailableConnectivities', connList)
    },
    setAvailableTraceFiles ({ commit }, traceFileList) {
      commit('setAvailableTraceFiles',
             traceFileList.map(trace => {
               const startDate = new Date(trace.config.start_date)
               const stopDate = new Date(trace.config.stop_date)
               trace.config.maxDuration =  Math.floor((stopDate - startDate) /
                                                      1000 /
                                                      60)
               return trace}))
    },
    setGitInfo ({ commit }, gitInfo) { commit('setGitInfo', gitInfo) },
    clearCrashReport({ commit }) { commit('setCrashReport', null) }
  }
}
