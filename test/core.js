describe('Core', () => {
  describe('BaseElement', () => {
    let b

    beforeEach(() => {
      b = new lab.BaseElement({})
    })

    it('loads', () => {
      b.prepare()
      b.run()
    })


    describe('Preparation', () => {
      it('skips automated preparation when tardy option is set', () => {
        // Set tardy option: No automated preparation
        b.tardy = true

        // Prepare callback to check whether preparation is run
        const callback = sinon.spy()
        b.on('prepare', callback)

        // Prepare item
        b.prepare(false) // indicate indirect prepare call

        assert.notOk(callback.called)
      })

      it('responds to manual preparation when tardy option is set', () => {
        // Set tardy option: No automated preparation
        b.tardy = true

        // Prepare callback to check whether preparation is run
        const callback = sinon.spy()
        b.on('prepare', callback)

        // Prepare item
        b.prepare() // direct call

        assert.ok(callback.calledOnce)
      })

      it('calls prepare method automatically when running unprepared', () => {
        const callback = sinon.spy()
        b.on('prepare', callback)

        b.run()

        assert.ok(callback.calledOnce)
      })

      it('calls prepare method automatically on run, even with tardy option', () => {
        const callback = sinon.spy()
        b.on('prepare', callback)

        // Set tardy option
        b.tardy = true
        b.run()

        assert.ok(callback.calledOnce)
      })

      it('does not call prepare on a previously prepared item when run', () => {
        // Prepare item beforehand
        b.prepare()

        const callback = sinon.spy()
        b.on('prepare', callback)
        b.run()

        assert.notOk(callback.called)
      })

      it('directs output to #labjs-content if no other element is specified', () => {
        b.prepare()

        assert.equal(
          b.el,
          document.querySelector('#labjs-content')
        )
      })
    })

    describe('Running', () => {
      it('resolves promise when running', () => {
        const p = b.run().then(() => {
          assert.ok(true)
        })
        b.end()
        return p
      })
    })

    describe('Timers', () => {
      it('timer property is undefined before running', () => {
        assert.equal(b.timer, undefined)
        b.prepare()
        assert.equal(b.timer, undefined)
        b.run()
        assert.notEqual(b.timer, undefined)
      })

      it('provides and increments timer property while running', () => {
        const clock = sinon.useFakeTimers()

        // Stub performance.now for the time being,
        // as described in https://github.com/sinonjs/sinon/issues/803
        sinon.stub(performance, 'now', Date.now)

        // Simulate progress of time and check timer
        b.run()
        assert.equal(b.timer, 0)
        clock.tick(500)
        assert.equal(b.timer, 500)
        clock.tick(500)
        assert.equal(b.timer, 1000)

        // Restore clocks
        clock.restore()
        performance.now.restore()
      })

      it('timer property remains static after run is complete', () => {
        // As above
        const clock = sinon.useFakeTimers()
        sinon.stub(performance, 'now', Date.now)

        b.run()
        clock.tick(500)
        assert.equal(b.timer, 500)
        b.end()
        clock.tick(500)
        assert.equal(b.timer, 500) // timer remains constant

        // Restore clocks
        clock.restore()
        performance.now.restore()
      })

      it('times out if requested', () => {
        // Setup fake timers
        const clock = sinon.useFakeTimers()

        // Set the timeout to 500ms
        b.timeout = 500
        b.prepare()

        // Setup a callback to be run
        // when the element ends
        const callback = sinon.spy()
        b.on('end', callback)

        // Run the element
        b.run()

        // Check that the callback is only
        // called after the specified interval
        // has passed
        assert.notOk(callback.called)
        clock.tick(500)
        assert.ok(callback.calledOnce)

        // Check that the resulting status is ok
        assert.equal(b.data.ended_on, 'timeout')

        // Restore timers
        clock.restore()
      })
    })

    describe('Event handlers', () => {
      it('runs event handlers in response to DOM events', () => {
        // Bind a handler to clicks within the document
        const handler = sinon.spy()
        b.events = {
          'click': handler
        }

        // Run the element
        const p = b.run()
        assert.notOk(handler.calledOnce)

        // Simulate click
        b.el.click()

        // End the element so that the result
        // can be checked
        b.end()

        // Make sure the handler is called
        return p.then(() => {
          assert.ok(handler.calledOnce)
        })
      })

      it('runs event handlers in response to specific events/emitters', () => {
        // We need to set the output element
        // manually at this point so that we
        // can inject content before running
        // .prepare()
        b.el = document.getElementById('labjs-content')

        // Simulate two buttons
        b.el.innerHTML = ' \
          <button id="btn-a">Button A</button> \
          <button id="btn-b">Button B</button>'

        // Create two handlers that are triggered
        // when the buttons are pressed
        const handler_a = sinon.spy()
        const handler_b = sinon.spy()

        b.events = {
          'click button#btn-a': handler_a,
          'click button#btn-b': handler_b,
        }

        // Simulate clicking both buttons in sequence,
        // and ensure that the associated handlers are triggered
        b.run()

        b.el.querySelector('button#btn-a').click()
        assert.ok(handler_a.calledOnce)
        assert.notOk(handler_b.called)

        b.el.querySelector('button#btn-b').click()
        assert.ok(handler_a.calledOnce)
        assert.ok(handler_b.calledOnce)

        b.end()

        // Clean up
        b.el.innerHTML = ''
      })

      it('binds event handlers to element', () => {
        // Define a spy and use it as an event handler
        const spy = sinon.spy()
        b.events = {
          'click': spy
        }

        // Prepare and run element
        const p = b.run()

        // Simulate click, triggering handler
        b.el.click()

        // Check binding
        assert.ok(spy.calledOn(b))

        // Cleanup
        b.end()
      })

      it('calls internal event handlers', () => {
        const callback_prepare = sinon.spy()
        b.on('prepare', callback_prepare)

        const callback_run = sinon.spy()
        b.on('run', callback_run)

        const callback_end = sinon.spy()
        b.on('end', callback_end)

        // Check whether internal event handlers
        // are called at the appropriate times
        b.prepare()
        assert.ok(callback_prepare.calledOnce)
        assert.notOk(callback_run.called)
        assert.notOk(callback_end.called)

        b.run()
        assert.ok(callback_prepare.calledOnce)
        assert.ok(callback_run.calledOnce)
        assert.notOk(callback_end.called)

        b.end()
        assert.ok(callback_prepare.calledOnce)
        assert.ok(callback_run.calledOnce)
        assert.ok(callback_end.calledOnce)
      })

      it('resolves promises via wait_for', () => {
        const p = b.wait_for('foo').then(() => {
          assert.ok(true)
        })

        b.triggerMethod('foo')

        return p
      })
    })

    describe('Responses', () => {
      it('maps responses onto event handlers', () => {
        b.responses = {
          'click': 'response_keypress'
        }

        // Attach a spy to the respond method
        const spy = sinon.spy(b, 'respond')

        // Run the element
        b.run()

        // Test whether the click triggers
        // a respond method call
        assert.notOk(spy.called)
        b.el.click()
        assert.ok(spy.withArgs('response_keypress').calledOnce)
        assert.ok(spy.calledOnce)

        // Cleanup
        b.end()
      })

      it('classifies correct responses as such', () => {
        // Define a correct response
        b.response_correct = 'foo'

        // Run the element
        b.run()

        // Trigger a response
        b.respond('foo')

        // Check the classification
        assert.equal(b.data.correct, true)

        // Check that the resulting status is ok
        assert.equal(b.data.ended_on, 'response')
      })

      it('classifies incorrect responses as such', () => {
        // Same as above
        b.response_correct = 'foo'
        b.run()
        b.respond('bar')

        // Check classification
        assert.equal(b.data.correct, false)

        // Check that the resulting status is ok
        assert.equal(b.data.ended_on, 'response')
      })
    })


    describe('Parameters', () => {
      it('can aggregate parameters from parents across multiple levels', () => {
        // Create elements
        const a = new lab.BaseElement()
        const b = new lab.BaseElement()
        const c = new lab.BaseElement()

        // Establish hierarchy (a > b > c)
        b.parent = a
        c.parent = b

        // Distribute parameters
        a.parameters['foo'] = 'bar'
        a.parameters['baz'] = 'quux'
        b.parameters['baz'] = 'queer'
        c.parameters['bar'] = 'bloop'

        // Check whether inheritance works properly
        assert.deepEqual(
          c.parameters_aggregate,
          {
            foo: 'bar',
            baz: 'queer',
            bar: 'bloop'
          }
        )
      })

      it('commits parameters alongside data', () => {
        // Parameter inheritance is tested elsewhere
        b.datastore = new lab.DataStore()
        b.parameters['foo'] = 'bar'
        b.commit()

        assert.equal(b.datastore.state.foo, 'bar')
      })
    })

    describe('Data', () => {
      it('commits data if datastore is provided', () => {
        b.datastore = new lab.DataStore()
        b.data['foo'] = 'bar'
        b.commit()

        assert.equal(b.datastore.state.foo, 'bar')
      })

      it('commits data automatically when ending', () => {
        // Spy on the commit method
        const spy = sinon.spy(b, 'commit')

        // Supply the BaseElement with a DataStore, then run
        b.datastore = new lab.DataStore()
        const p = b.run()
        b.end()

        // Make sure the commit method was run
        return p.then(() => {
          assert.ok(spy.calledOnce)
        })
      })
    })

    describe('Hierarchy traversal', () => {
      it('provides parents attribute', () => {
        const a = new lab.BaseElement()
        const b = new lab.BaseElement()
        const c = new lab.BaseElement()

        c.parent = b
        b.parent = a

        assert.deepEqual(
          c.parents,
          [a, b]
        )
      })
    })
    
  })
})
