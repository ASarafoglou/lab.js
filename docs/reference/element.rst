Elements
========

.. _reference/base/BaseElement:

The :js:class:`BaseElement` class is the most basic class provided by lab.js .
It is the foundation for all other components, which extend and slightly modify
this basic class. As per the philosophy of lab.js, experiments are composed
entirely out of these components, which provide the structure of the study's
code.

In many cases, you will not include a :js:class:`BaseElement` directly in your
experiment. Instead, your experiment will most likely consist of the other
building blocks which lab.js provides, all of which derive from this fundamental
class.

Because all other components provided by the library are derived from the
:js:class:`BaseElement`, they show the same behaviour, and accept the same
options, so that you will (hopefully) find yourself referring to this part of
the documentation from time to time.

Behaviour
---------

Following its creation, an element will go through several distinct **stages**.

The **preparation** stage is designed to prepare the element for its later
use in the experiment in the best possible way. For example, a display might be
prerendered during this phase, and any necessary assets loaded. Importantly,
by the time an element is prepared, its settings have to have been finalized.

The **run** stage is the big moment for any element of an experiment. Upon
running, the element assumes (some degree of) control over the study: It starts
capturing and responding to events triggered by the user, it might display
information or stimuli on screen, through sound, or by any other means.

The **end** marks the close of an element's activity. It cedes control over
the output, and stops listening to any events emitted by the browser. If there
are data to log, it is taken care of after the element's run is complete.
Similarly, any housekeeping or cleaning-up is done at this point.


Usage
-----

.. js:class:: BaseElement([options])

  The :js:class:`BaseElement` does not, by itself, display information or modify
  the page. However, it can be (and is throughout lab.js) extended to meet
  even very complex requirements.

  An element is constructed only an object containing options regarding
  its behavior. ::

    var e = new lab.BaseElement({
      'responses': {
        'keypress(s)': 'left',
        'keypress(l)': 'right'
      },
      'timeout': 1000
    })

    e.prepare()
    e.run()

  **Actions**

  .. js:function:: prepare()

    Trigger the element's prepare phase.

    Make the preparations necessary for :js:func:`run`-ning and element; for
    example, preload all necessary :js:attr:`media` required later.

    The :js:func:`prepare` method can, but need not be called manually: The
    preparation phase will be executed automatically when the the element is
    :js:func:`run`.

    Flow control elements such as the :js:class:`Sequence` will automatically
    prepare all subordinate elements unless these are explicitly marked as
    :js:attr:`tardy`.


  .. js:function:: run()

    Show the element, giving it control over the participants' screen until the
    :js:func:`end` method is called. Calling :js:func:`run` will trigger
    :js:func:`prepare` if it has not been already been run.

    :returns: A promise that resolves when :js:func:`end` is called on the
      element.

  .. js:function:: respond([response])

    Collect a response and call :js:func:`end`.

    This is a shortcut for the (frequent) cases in which the element ends with
    the observation of a response. The method will add the contents of the
    ``response`` argument to the element's :js:attr:`data`, evaluate it against
    the ideal response as specified in :js:attr:`response_correct`, and then
    :js:func:`end` the element's run.

  .. js:function:: end([reason])

    End a running element. This causes an element to cede control over the
    browser, so that it can be passed on to the next element: It no longer
    monitors :js:attr:`events` on the screen, collects all the accumulated
    :js:attr:`data` commits it to the specified :js:attr:`datastore`, and
    performs any housekeeping that might be due.

  .. js:attribute:: tardy

    Ignore automated attempts to :js:func:`prepare` the element, defaults to
    ``false``.

    Setting this attribute to ``true`` will mean that the element needs to be
    prepared manually through a call to :js:func:`prepare`, or (failing this)
    that it will be prepared immediately before it is :js:func:`run`, at the
    last minute.

  **Basic settings**

  .. js:attribute:: debug

    Activate debug mode (defaults to ``false``)

    If this option is set, the element provides additional debug information via
    the browser console.

  .. js:attribute:: el

    ``HTML`` element within the document that will hold content. Defaults to the
    element with the id ``labjs-content``.

    The :js:attr:`el` property determines where in the document the contents of
    the experiment will be placed. Every part of the experiment will replace
    the contents of this element entirely, and substitute its own information.
    For example, an :js:class:`HTMLScreen` will insert custom ``HTML``, whereas
    a :js:class:`CanvasScreen` will supply a ``Canvas`` on which information is
    then drawn.

    To change the location of the content, you can pick out the element of the
    ``HTML`` document where you would like the content placed as follows::

      const b = new lab.BaseElement({
        el: document.getElementById('experiment_content_goes_here')
        // ... additional options ...
      })

    This assumes that the ``HTML`` document that contains the experiment
    includes an element hat meets this criterion, for example the following:

    .. code-block:: html

      <div id="experiment_content_goes_here"></div>

  **Metadata**

  .. js:attribute:: title

    Human-readable title for the element, defaults to ``null``

    This is included in any data stored by the element, and can be used to pick
    out individual elements.

  .. js:attribute:: id

    Machine-readable element id (``null``)

    Sequences will automatically number contained elements when prepared.

  .. js:attribute:: parameters

    Settings that govern the display of the element ({})

    This object contains any user-specified custom settings that determine an
    element's display and behavior.

    The difference between :js:attr:`parameters` and :js:attr:`data` is that the
    former are retained at all costs, while the :js:attr:`data` may be reset at
    some later time if necessary. Thus, any information that is constant and set
    a priori, but does not change after the element's preparation should be
    stored in the :js:attr:`parameters`, whereas all data collected later should
    be (and is automatically) collected in the :js:attr:`data` attribute.

    Please also note that the :js:attr:`parameters` are made available to any
    nested elements through :js:attr:`parameters_aggregate`, while no such
    mechanism exists for :js:attr:`data`.

  .. js:attribute:: parameters_aggregate

    Combination of the element's parameters and those of any superordinate
    elements (read-only)

    Often, an element's behavior is determined not only by its own
    :js:attr:`parameters`, but also by those of superordinate elements. For
    example, an element might be contained within a :js:class:`Sequence`
    representing a block of stimuli of the same type.
    In this and many similar situations, it makes sense to define parameters on
    superordinate elements, which are then applied to all subordinate, nested,
    elements.

    The :js:attr:`parameters_aggregate` attribute combines the
    :js:attr:`parameters` of any single element with those of superordinate
    elements, if there are any. Within this structure, parameters defined at
    lower, more specific, levels override those with an otherwise broader scope.

    Consider the following structure::

      const experiment = lab.Sequence([
        lab.BaseElement({
          'title': 'Nested element',
          'parameters': {
            'color': 'red'
          }
        })
      ], {
        'title': 'Superordinate sequence',
        'parameters': {
          'color': 'blue',
          'text': 'green'
        }
        // ... additional options ...
      })

    In this case, the nested element inherits the parameter ``text`` from the
    superordinate sequence, but not ``color``, because the value of this
    parameter is defined anew within the nested element itself.

  **Response handling**

  .. js:attribute:: responses

    Map of response events onto response descriptions ({})

    The responses hash maps the actions a participant might take onto the
    responses saved in the data. If a response is collected, the element ends
    immediately.

    For example, if the possible responses are to press the keys ``s`` and
    ``l``, and these map onto the categories *left* and *right*, the response
    map might look as follows::

      'responses':  {
        'keypress(s)': 'left',
        'keypress(l)': 'right'
      }

    The left part, or the keys of this object, defines the **browser event**
    corresponding to the response. This value follows the `event type syntax
    <http://www.w3.org/TR/DOM-Level-3-Events/>`_, so that any browser event may
    be caught. Additional (contrived) examples might be::

      'responses': {
        'keypress(s)': 'The s key was pressed',
        'keypress input': 'Participant typed in a form field',
        'click': 'A mouse click was recorded',
        'click button.option_1': 'Participant clicked on option 1'
      }

    As is visible in the first example, additional **options** for each event
    can be specified in brackets. These are:

    * For ``keypress`` events, the letters corresponding to the desired keys,
      or alternatively ``space`` and ``enter`` for the respective keys.
      Multiple keys can be defined by separating letters with a comma.
    * For ``click`` events, the mouse button used. Buttons are numbered from
      the index finger outwards, i.e. on a right-handed mouse, the leftmost
      button is ``0``, the middle button is ``1``, and so on, and vice versa for
      a left-handed mice. (please note that you may need to catch and handle
      the ``contextmenu`` event if you would like to stop the menu from
      appearing when the respective button is pressed.)

    Finally, a **target element** can be specified for every event (note that
    this refers to an element in the HTML page, not a part of the experiment),
    as is the case in the last example. The element in question is identified
    through a CSS selector. If an element is specified in this manner, the
    response is limited to that element, so a click will only be collected if it
    hits this specific element, and a keyboard event will only be responded to
    if the element is selected when the button is pressed (for example if text
    is input into a form field).

  .. js:attribute:: response_correct

    Label or description of the correct response (defaults to ``null``)

    The :js:attr:`response_correct` attribute defines the label of the normative
    response. For example, in the simple example given above, it could take
    the values ``'left'`` or ``'right'``, and the corresponding response would
    be classified as correct.

  **Timing**

  .. js:attribute:: timer

    Timer for the element (read-only)

    The :js:attr:`timer` attribute provides the central time-keeping instance
    for the element. Until the element is :js:func:`run`, it will be set to
    ``undefined``. Then, until the :js:func:`end` of an element's cycle, it will
    continuously provide the duration (in milliseconds) for which it has been
    running. Finally, once the cycle has reached its :js:func:`end`, it will
    provide the time difference between the start and the end of the element's
    run cycle.

  .. js:attribute:: timeout

    Delay between element run and automatic end (null)

    The element automatically ends after the number of milliseconds specified in
    this option, if it is set.

  **Data collection**

  .. js:attribute:: data

    Additional data ({})

    Any additional data (e.g. regarding the current trial) to be saved alongside
    automatically generated data entries (e.g. response and response time).

    This option should be an object, with the desired information in its keys
    and values.

    Please consult the entry for the :js:attr:`parameters` for an explanation
    of the difference between these and :js:attr:`data`.

  .. js:attribute:: datastore

    Store for any generated data (``null`` by default)

    A :ref:`DataStore` object to handle data collection (and export). If this
    is not set, the data will not be collected in a central location outside the
    element itself.

  .. js:attribute:: datacommit

    Whether to commit data by default (``true``)

    If you would prefer to handle data manually, unset this option to prevent
    data from being commit when the element ends.

  **Preloading media**

  .. js:attribute:: media

    Media files to preload ({})

    Images and audio files can be preloaded in the background, to reduce load
    times later during the experiment. To achieve this, supply an object
    containing the urls of the files in question, split into images and audio
    files as follows::

        'media': {
          'images': [
            'https://mydomain.example/experiment/stimulus.png'
          ],
          'audio': [
            'https://mydomain.example/experiment/sound.mp3'
          ]
        }

    Both image and audio arrays are optional, and empty by default.

    Please note that this method has some **limitations**. First, the files are
    loaded asynchronously in the background, starting during the prepare phase.
    The experiment does not wait until the files have completed loading. Second,
    the preloading mechanism is dependent upon the browser's file cache, which
    cannot be fully controlled. The media file might have been removed from the
    cache by the time it is needed. Thus, this is a somewhat brittle mechanism
    which can improve load times, but is, for technical reasons, not fail-safe.
    In our experience, testing across several browsers reliably indicates
    whether preloading is dependable for a given experiment.

  **Advanced options**

  .. js:attribute:: events

    Map of additional event handlers ({})

    In many experiments, the only events that need to be handled are responses,
    which can be defined using the response option described above. However,
    some studies may require additional handling of events before a final
    response is collected. In these cases, the events object offers an
    alternative.

    The events option follows the same format used for the responses, as
    outlined above. However, instead of a string response, the object values on
    the right-hand side are event handler functions, which are called whenever
    the specified event occurs. The functions are expected to receive the event
    in question as an argument, and process it as they see fit. They are
    automatically bound to the element in question, which is available within
    the function through the ``this`` keyword.

    As a very basic example, one might want to ask users not to change to other
    windows during the experiment::

      'events': {
        'visibilitychange': function(event) {
          if (document.hidden) {
            alert(`Please don't change windows while the experiment is running`)
          }
        }
      }
